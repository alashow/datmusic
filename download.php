<?php
/* ========================================================================
 * Music v1.2.8
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
$fileName = $audio["artist"] . " - " . $audio["title"];
$audioUrl = $audio["url"];

$filePath = "dl/" . md5($audioId) . ".mp3"; //caching mp3s, md5 for unique audioIds

if (file_exists($filePath)) {
  if ($isStream) {
    stream($filePath, $fileName);
  } else {
    forceDownload($filePath, $fileName);
  }
  return;
} else {
  if (downloadFile($audioUrl, $filePath)) {
    if ($isStream) {
      stream($filePath, $fileName);
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
  logDownload("$filePath $fileName"); //log

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
function stream($file, $fileName) {
    logStream("$file $fileName"); //log

    @error_reporting(0);
    // Make sure the files exists, otherwise we are wasting our time
    if (!file_exists($file)) {
        notFound();
    }

    //just redirect to file
    header("Location: $file");
}

/**
 * Function: sanitize
 * Returns a sanitized string, typically for URLs.
 *
 * Parameters:
 *     $string - The string to sanitize.
 *     $force_lowercase - Force the string to lowercase?
 *     $anal - If set to *true*, will remove all non-alphanumeric characters.
 *     $trunc - Number of characters to truncate to (default 100, 0 to disable).
 */
function sanitize($string, $force_lowercase = true, $anal = false, $trunc = 100) {
    $strip = array("~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "=", "+", "[", "{", "]",
                   "}", "\\", "|", ";", ":", "\"", "'", "&#8216;", "&#8217;", "&#8220;", "&#8221;", "&#8211;", "&#8212;",
                   "—", "–", ",", "<", ".", ">", "/", "?");
    $clean = trim(str_replace($strip, "", strip_tags($string)));
    // $clean = preg_replace('/\s+/', "-", $clean);
    $clean = ($anal ? preg_replace("/[^a-zA-Z0-9]/", "", $clean) : $clean);
    $clean = ($trunc ? substr($clean, 0, $trunc) : $clean);
    return ($force_lowercase) ?
        (function_exists('mb_strtolower')) ?
            mb_strtolower($clean, 'UTF-8') :
            strtolower($clean) :
        $clean;
}

// https://gist.github.com/alashow/07d9ef9c02ee697ab47d
function decode($encoded) {
  $map = array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', '1', '2', '3');
  
  $length = count($map);
  
  $decoded = 0;
  
  for ($i = strlen($encoded) - 1; $i >= 0; $i--) {
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
?>