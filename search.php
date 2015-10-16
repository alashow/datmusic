<?php 
$apiUrl = "https://api.vk.com/method/audio.search?";
$_GET['access_token'] = "fff9ef502df4bb10d9bf50dcd62170a24c69e98e4d847d9798d63dacf474b674f9a512b2b3f7e8ebf1d69"; //for private access token. if public, comment this line so access token from js will be used

$fullUrl = $apiUrl . $_SERVER['QUERY_STRING'];

print(file_get_contents($fullUrl));
exit;
?>