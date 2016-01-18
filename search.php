<?php 
/* ========================================================================
 * Music v1.2.7
 * https://github.com/alashow/music
 * ======================================================================== */

include 'helper.php';
logSearch($_GET['q']);

$apiUrl = "https://api.vk.com/method/audio.search?";
$params = $_GET;
$params['access_token'] = $config["token"]; //for private access token. if public, comment this line so access token from js will be used

$fullUrl = $apiUrl . http_build_query($params);

$response = file_get_contents($fullUrl);

//hehe https://datmusic.xyz/stream/YGexC:AEYtr
die($response);
?>