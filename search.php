<?php 
/* ========================================================================
 * Music v1.2.7
 * https://github.com/alashow/music
 * ======================================================================== */

include 'log.php';
logSearch($_GET['q']);

$apiUrl = "https://api.vk.com/method/audio.search?";
$params = $_GET;
$params['access_token'] = "fff9ef502df4bb10d9bf50dcd62170a24c69e98e4d847d9798d63dacf474b674f9a512b2b3f7e8ebf1d69"; //for private access token. if public, comment this line so access token from js will be used

$fullUrl = $apiUrl . http_build_query($params);

print(file_get_contents($fullUrl));
exit;
?>