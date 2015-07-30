<?php
ignore_user_abort(true);
set_time_limit(0);

$audioId = $_GET["audio_id"];
$token = "e9dbafe947e48136f15bbaf1184095282f53bb146441910421e180b46fa6cf6cf8c37f7de3f525d2c121d"; //get your own if not working

if (!isset($_GET["audio_id"]) && isset($_GET['id'])) {
  $audioId = split(":", $_GET['id']);
  
  $ownerId = $audioId[0];
  $aid = $audioId[1];
  
  $audioId = ""; //clear string
  
  if (startsWith($ownerId, "-")) {
    $ownerId = substr($ownerId, 1);
    $audioId = "-";
  }
  
  $audioId.= decode($ownerId) . "_" . decode($aid);
}

$audioGetUrl = "https://api.vk.com/method/audio.getById?audios=" . $audioId . "&access_token=" . $token;

$response = file_get_contents($audioGetUrl);
$json = json_decode($response, true);

if (empty($json['response'])) {
  notFound();
}

$audio = $json['response'][0];
$filename = makeSafe(transliterate($audio["artist"] . " - " . $audio["title"] . ".mp3"));
$audioUrl = $audio["url"];
$fullpath = "dl/" . $filename;

if (file_exists($fullpath)) {
  forceDownload($fullpath, $filename);
} else {
  if (downloadFile($audioUrl, $fullpath)) {
    forceDownload($fullpath, $filename);
  }
}

function notFound() {
  header('HTTP/1.0 404 Not Found');
  readfile("/home/alashov/www/.config/404.html");
  exit();
}

function makeSafe($file) {
  $file = rtrim($file, '.');
  $regex = array('#(\.){2,}#', '#[^A-Za-z0-9\.\_\- ]#', '#^\.#');
  return trim(preg_replace($regex, '', $file));
}

function transliterate($textcyr = null, $textlat = null) {
  $cyr = array('ж', 'ч', 'щ', 'ш', 'ю', 'а', 'б', 'в', 'г', 'д', 'e', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ъ', 'ь', 'я', 'Ж', 'Ч', 'Щ', 'Ш', 'Ю', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ъ', 'Ь', 'Я');
  $lat = array('zh', 'ch', 'sht', 'sh', 'yu', 'a', 'b', 'v', 'g', 'd', 'e', 'z', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'h', 'c', 'y', 'x', 'q', 'Zh', 'Ch', 'Sht', 'Sh', 'Yu', 'A', 'B', 'V', 'G', 'D', 'E', 'Z', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'F', 'H', 'c', 'Y', 'X', 'Q');
  if ($textcyr) return str_replace($cyr, $lat, $textcyr);
  else if ($textlat) return str_replace($lat, $cyr, $textlat);
  else return null;
}
// https://gist.github.com/alashow/07d9ef9c02ee697ab47d
function decode($encoded) {
  $map = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z', '1', '2', '3'];
  
  $length = count($map);
  
  $decoded = 0;
  
  for ($i = strlen($encoded) - 1;$i >= 0;$i--) {
    $ch = $encoded[$i];
    $val = array_search($ch, $map);
    $decoded = ($decoded * $length) + $val;
  }
  
  return $decoded;
}

function startsWith($haystack, $needle) {
  // search backwards starting from haystack length characters from the end
  return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== FALSE;
}

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

function forceDownload($file, $name) {
  $fileSize = filesize($file);
  header("Cache-Control: private");
  header("Content-Description: File Transfer");
  header("Content-Disposition: attachment; filename=$name");
  header("Content-Type: audio/mpeg");
  header("Content-length: $fileSize");
  readfile($file);
}
?>