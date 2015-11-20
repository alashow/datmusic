<?php
/* ========================================================================
 * Music v1.2.7
 * https://github.com/alashow/music
 * ======================================================================== */

ignore_user_abort(true);
set_time_limit(0);
ini_set('display_errors', 0);

include 'log.php';

$audioId = $_GET["audio_id"];
$isStream = isset($_REQUEST["stream"]);
$token = "fff9ef502df4bb10d9bf50dcd62170a24c69e98e4d847d9798d63dacf474b674f9a512b2b3f7e8ebf1d69"; //get your own if don't works

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

$audioGetUrl = "https://api.vk.com/method/audio.getById?audios=" . $audioId . "&access_token=" . $token;

$response = file_get_contents($audioGetUrl);
$json = json_decode($response, true);

if (empty($json['response'])) {
  notFound();
}

$audio = $json['response'][0];
$fileName = $audio["artist"] . " - " . $audio["title"] . ".mp3";
$audioUrl = $audio["url"];

$filePath = "dl/" . md5($audioId); //caching mp3s, md5 for unique audioIds

if (file_exists($filePath)) {
  if ($isStream) {
    stream($filePath);
  } else {
    forceDownload($filePath, $fileName);
  }
  return;
} else {
  if (downloadFile($audioUrl, $filePath)) {
    if ($isStream) {
      stream($filePath);
    } else {
      forceDownload($filePath, $fileName);
    }
  }
}

//Functions

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
    notFound();
    return false;
  }
  
  curl_close($ch);
  fclose($fp);
  return true;
}

/**
 * Return file as response
 * @param $filePath path of file to return
 * @param $fileName name of file to return
 */
function forceDownload($filePath, $fileName) {
  writeDownload("$filePath $filename"); //log

  header("Cache-Control: private");
  header("Content-Description: File Transfer");
  header("Content-Disposition: attachment; filename=\"" . makeSafe(transliterate($fileName)) . "\"");
  header("Content-Type: audio/mpeg");
  header("Content-length: " . filesize($filePath));
  readfile($filePath);
}

/**
 * Stream-able file handler
 *
 * @param String $file_location
 * @param Header|String $content_type
 * @return content
 */
function stream($file, $content_type = 'audio/mpeg') {
    writeStream("$filePath $filename"); //log

    @error_reporting(0);
    // Make sure the files exists, otherwise we are wasting our time
    if (!file_exists($file)) {
        notFound();
    }

    // Get file size
    $filesize = sprintf("%u", filesize($file));

    // Handle 'Range' header
    if(isset($_SERVER['HTTP_RANGE'])){
        $range = $_SERVER['HTTP_RANGE'];
    } else {
      $range = FALSE;
    }

    //Is range
    if($range){
        $partial = true;
        list($param, $range) = explode('=',$range);
        // Bad request - range unit is not 'bytes'
        if(strtolower(trim($param)) != 'bytes'){ 
            header("HTTP/1.1 400 Invalid Request");
            exit;
        }
        // Get range values
        $range = explode(',',$range);
        $range = explode('-',$range[0]); 
        // Deal with range values
        if ($range[0] === ''){
            $end = $filesize - 1;
            $start = $end - intval($range[0]);
        } else if ($range[1] === '') {
            $start = intval($range[0]);
            $end = $filesize - 1;
        } else { 
            // Both numbers present, return specific range
            $start = intval($range[0]);
            $end = intval($range[1]);
            if ($end >= $filesize || (!$start && (!$end || $end == ($filesize - 1)))) {
              $partial = false; // Invalid range/whole file specified, return whole file
            }
        }
        $length = $end - $start + 1;
    } else { // No range requested
      $partial = false; 
    }

    // Send standard headers
    header("Content-Type: $content_type");
    header("Content-Length: $filesize");
    header('Accept-Ranges: bytes');

    // send extra headers for range handling...
    if ($partial) {
        header('HTTP/1.1 206 Partial Content');
        header("Content-Range: bytes $start-$end/$filesize");
        if (!$fp = fopen($file, 'rb')) {
            header("HTTP/1.1 500 Internal Server Error");
            exit;
        }
        if ($start) {
          fseek($fp,$start);
        }
        while($length){
            set_time_limit(0);
            $read = ($length > 8192) ? 8192 : $length;
            $length -= $read;
            print(fread($fp,$read));
        }
        fclose($fp);
    } else { //just send the whole file
      readfile($file); 
    }
    exit;
}

/**
 * Safer filename
 */
function makeSafe($file) {
  $file = rtrim($file, '.');
  $regex = array('#(\.){2,}#', '#[^A-Za-z0-9\.\_\- ()]#', '#^\.#');
  return trim(preg_replace($regex, '', $file));
}

/**
 * Cyrillic to Latyn or Latyn to Cyryllic letters
 * @param $textCyryllic cyryllic text
 * @param $textLatyn latynText
 * @return transliterated string
 */
function transliterate($textCyryllic = null, $textLatyn = null) {
  $cyryllic = array('ж', 'ч', 'щ', 'ш', 'ю', 'а', 'б', 'в', 'г', 'д', 'e', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ъ', 'ь', 'я', 'Ж', 'Ч', 'Щ', 'Ш', 'Ю', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ъ', 'Ь', 'Я');
  $latyn = array('zh', 'ch', 'sht', 'sh', 'yu', 'a', 'b', 'v', 'g', 'd', 'e', 'z', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'h', 'c', 'y', 'x', 'q', 'Zh', 'Ch', 'Sht', 'Sh', 'Yu', 'A', 'B', 'V', 'G', 'D', 'E', 'Z', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'F', 'H', 'c', 'Y', 'X', 'Q');
  if ($textCyryllic) return str_replace($cyryllic, $latyn, $textCyryllic);
  else if ($textLatyn) return str_replace($latyn, $cyryllic, $textLatyn);
  else return null;
}

// https://gist.github.com/alashow/07d9ef9c02ee697ab47d
function decode($encoded) {
  $map = array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', '1', '2', '3');
  
  $length = count($map);
  
  $decoded = 0;
  
  for ($i = strlen($encoded) - 1;$i >= 0;$i--) {
    $ch = $encoded[$i];
    $val = array_search($ch, $map);
    $decoded = ($decoded * $length) + $val;
  }
  
  return $decoded;
}

/**
 * Search backwards starting from haystack length characters from the end
 */
function startsWith($haystack, $needle) {
  return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== FALSE;
}

/**
 * Exit with notFound error
 */
function notFound() {
  header('HTTP/1.0 404 Not Found');
  //your not found file
  readfile("/home/alashov/web/.config/404.html");
  exit();
}


function getAllHeaders() { 
  $headers = ''; 
  foreach ($_SERVER as $name => $value) { 
    if (substr($name, 0, 5) == 'HTTP_') {
      $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value; 
    } 
  } 
  return $headers; 
} 
?>