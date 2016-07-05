<?php 
/* ========================================================================
 * Music v1.4.0
 * https://github.com/alashow/music
 * ======================================================================== */

include 'helper.php';
logSearch($_GET['q']);

$apiUrl = "https://api.vk.com/method/audio.search?";
$params = $_GET;
$params["access_token"] = $config["token"]; //for private access token. if public, comment this line so access token from js will be used

//doing some magic here. read about Jquery.Ajax callback here http://stackoverflow.com/questions/12864096/can-i-make-a-jquery-jsonp-request-without-adding-the-callback-parameter-in-u
//web app client sends unique callback string for each call. it's not good for our json caching (because it's based on md5 of url)
//solution: save original callback string, replace with unique string in url, replace saved one with original in response.
if (isset($params["callback"])) {	
	$originalJsonCallback = $params["callback"];
	$params["callback"] = "63kfn61Ikx90Nw"; //just an unique random string
}

$fullUrl = $apiUrl . http_build_query($params);

if ($config['isNoCache']) {
    removeCacheForUrl($fullUrl);
}

$result = file_get_contents_with_cache($fullUrl, true);

$resultJson = json_decode(preg_replace('/.+?({.+}).+/', "$1", $result), true);

//if response has errors or has no response
if (! empty($resultJson["error"]) || empty($resultJson["response"])) {
  	removeCacheForUrl($fullUrl);
}

if (isset($originalJsonCallback)) {
	//replacing callback string back
	$result = str_replace($params["callback"], $originalJsonCallback, $result);
}

//hehe https://datmusic.xyz/stream/YGexC:AEYtr
die($result);
?>