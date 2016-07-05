<?php
/* ========================================================================
 * Music v1.4.0
 * https://github.com/alashow/music
 * ======================================================================== */

ignore_user_abort(true);
set_time_limit(0);
ini_set('display_errors', 0);

include 'helper.php';

$audioId = $_GET["audio_id"];
$isStream = isset($_REQUEST["stream"]);

if (!isset($_GET["audio_id"]) && isset($_GET['id'])) {
  $audioId = split(":", $_GET['id']);
  
  $ownerId = $audioId[0];
  $aid = $audioId[1];
  
  $audioId = ""; //clear string
  
  if (startsWith($ownerId, "-")) {
    $ownerId = substr($ownerId, 1);
    $audioId = "-";
  }
  
  $audioId .= decode($ownerId) . "_" . decode($aid);
}

if (strlen($audioId) <= 1) {
    notFound();
}

$audioGetUrl = "https://api.vk.com/method/audio.getById?audios={$audioId}&access_token={$config['token']}";

$captcha_sid = $_REQUEST["sid"];
$captcha_key = $_REQUEST["key"];

if (isset($captcha_sid) && isset($captcha_key)) {
  $audioGetUrl .= "&captcha_sid={$captcha_sid}&captcha_key={$captcha_key}";
}

if ($config["isNoCache"]) {
  removeCacheForUrl($audioGetUrl);
}


$response = file_get_contents_with_cache($audioGetUrl);

//print response and die if debugging
if($config["isDebug"]){
   die($response);
}

$json = json_decode($response, true);

if (empty($json['response'])) {
  //clear cache if no result in json
  removeCacheForUrl($audioGetUrl);

  $error = $json['error'];

  //notEmpty & isCaptcha
  if (!empty($error) && intval($error["error_code"]) == 14) {
    header('HTTP/1.0 404 Not Found');
     ?>
       <meta charset="utf-8">
       <meta name="theme-color" content="#C0392B">
       <style>body{background:#C0392B;margin:0}.center{margin:auto;width:20%;padding:10px;text-align:center}.center h1{color:white}.center img{width:100%}.center input{width:95%;padding:5px}</style>
       <title><?=$error['error_msg']?></title>
       <div class="center">
         <h1><?=$error['error_msg']?></h1>
         <img src="https://dotjpg.co/timthumb/thumb.php?w=300&src=<?=$error['captcha_img']?>" alt="Captcha">
         <form action="" method="POST">
           <input type="hidden" name="tokenIndex" value="<?=getCurrentTokenIndex()?>"/>
           <input type="hidden" name="sid" value="<?=$error['captcha_sid']?>"/>
           <input type="text" name="key" placeholder="Type code above">
           <button type="submit">Submit</button>
         </form>
       </div>
     <?
     exit();
  } else {
    notFound();
  }
}

$audio = $json['response'][0];
$fileName = $audio["artist"] . " - " . $audio["title"];
$audioUrl = $audio["url"];

$bitrate = intval($_REQUEST["bitrate"]);

if (! in_array($bitrate, $config["allowed_bitrates"])) {
  $bitrate = -1;
}

//md5 hashing audioId for unique filenames in cache folder
$filePath = $config["dl_folder"] . "/" . md5($audioId) . ".mp3";
//converted name with bitrate suffix
$filePathConverted = str_replace(".mp3", "_$bitrate.mp3", $filePath);

//if file already exists, serve/stream it. if not, download it and then server/stream.
if (file_exists($filePath) || downloadFile($audioUrl, $filePath)) {
  if ($bitrate > 0) {
    //check cache for converted one, if no cache, convert it.
    if (! file_exists($filePathConverted)) {
      convertMp3Bitrate($bitrate, $filePath, $filePathConverted);
    }
    //change serving/streaming filePath to converted one.
    $filePath = $filePathConverted; 
  }

  //serve/stream
  if ($isStream) {
    stream($filePath, $fileName);
  } else {
    forceDownload($filePath, $fileName);
  }
}

//Functions

/**
 * Executes ffmpeg command synchronously for converting given file to given bitrate
 * @param $bitrate integer, one of $config["allowed_bitrates"]
 * @param $input input mp3 file full path
 * @param $output output mp3 file full path
 */
function convertMp3Bitrate($bitrate, $input, $output) {
  global $config, $fileName;

  logConvert("$input $fileName $bitrate");

  $bitrateString = $config["allowed_bitrates_ffmpeg"][array_search($bitrate, $config["allowed_bitrates"])];

  //FIXME: ffmpeg not always in path
  exec("ffmpeg -i $input -codec:a libmp3lame $bitrateString $output");
}

/**
 * Download file with given name to given path
 * @param $url url to download
 * @param $path output filepath
 * @return true if success, else you know what
 */
function downloadFile($url, $path) {
  $fp = fopen($path, 'wb');
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_FILE, $fp);
  curl_setopt($ch, CURLOPT_HEADER, 0);
  curl_setopt($ch, CURLOPT_FAILONERROR, 1);
  curl_exec($ch);
  fclose($fp);
  
  if (curl_errno($ch) > 0) {
    global $audioGetUrl;
    
    removeCacheForUrl($audioGetUrl);
    notFound();
    return false;
  }
  
  curl_close($ch);
  fclose($fp);
  return true;
}

/**
 * VK sometimes redirects to error page, but curl downloads redirect page, which is html.
 * check if downloaded file is html and throw 404
 * if mp3 size smaller than 170 bytes (default/expected size is 158) check is html and exit with 404
 */
function checkIsBadMp3($filePath) {
  $size = filesize($filePath);

  if ($size < 170) {
      $content = file_get_contents($filePath);

      if (startsWith($content, "<html>")) {
          unlink($filePath);
          notFound();
          return false;
      }
  }
}

/**
 * Return file as response
 * @param $filePath path of file to return
 * @param $fileName name of file to return
 */
function forceDownload($filePath, $fileName) {
  logDownload("$filePath $fileName");

  checkIsBadMp3($filePath);

  header("Cache-Control: private");
  header("Content-Description: File Transfer");
  header("Content-Disposition: attachment; filename=\"" . sanitize($fileName, false, false) . ".mp3\"");
  header("Content-Type: audio/mpeg");
  header("Content-length: " . filesize($filePath));
  readfile($filePath);
}

/**
 * Stream audio. Now just redirects to file.
 *
 * @param String $filePath path of file
 * @param String $fileName name of audio for log
 * @return content
 */
function stream($filePath, $fileName) {
    logStream("$filePath $fileName");

    checkIsBadMp3($filePath);

    @error_reporting(0);
    // Make sure the files exists, otherwise we are wasting our time
    if (!file_exists($filePath)) {
        notFound();
    }

    //just redirect to file
    header("Location: /$filePath");
}
?>