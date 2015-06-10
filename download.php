<?php
ignore_user_abort(true);
set_time_limit(0);

$token = "e9dbafe947e48136f15bbaf1184095282f53bb146441910421e180b46fa6cf6cf8c37f7de3f525d2c121d";
$audioId = $_GET["audio_id"];
$audioGetUrl = "https://api.vk.com/method/audio.getById?audios=" . $audioId . "&access_token=" . $token;

function isValidUrl($URL) {
  $headers = @get_headers($URL);
  preg_match("/ [45][0-9]{2} /", (string)$headers[0], $match);
  return count($match) === 0;
}

function notFound(){
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

function downloadFile($url, $path) {
  if (isValidUrl($url)) {
    touch($path);
    $remoteFile = fopen($url, "rb");
    if ($remoteFile) {
      $newFile = fopen($path, "wb");
      if ($newFile) while (!feof($remoteFile)) {
        fwrite($newFile, fread($remoteFile, 1024 * 8), 1024 * 8);
      }
    } 
    else return false;
    
    if ($remoteFile) {
      fclose($remoteFile);
    }
    if ($newFile) {
      fclose($newFile);
    }
    return true;
  } 
  else {
    notFound();
    return false;
  }
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
} 
else {
  if (downloadFile($audioUrl, $fullpath)) {
    forceDownload($fullpath, $filename);
  }
}
?>