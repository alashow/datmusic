<?php
/* ========================================================================
 * Music v1.3.1
 * https://github.com/alashow/music
 * ======================================================================== */
//get your own if doesn't work: https://github.com/alashow/music/wiki#how-to-get-your-own-token
//add tokens to array, random one will be used.
$config["tokens"] = array("fff9ef502df4bb10d9bf50dcd62170a24c69e98e4d847d9798d63dacf474b674f9a512b2b3f7e8ebf1d69");
$config["cache_enabled"] = true;
$config["cache_folder"] = "cache";
$config["dl_folder"] = "dl";
$config["log_filename"] = "log";
$config["not_found_file_path"] = "/home/alashov/web/.config/404.html";

//fixed token index can be send from download.php, when user types captcha. to pass captcha, we need to give vk same token and with returned captcha, not random one. otherwise, user typed captcha code will be waste.
$tokenIndex = intval($_REQUEST["tokenIndex"]);
if (isset($_REQUEST["tokenIndex"])) {
	setTokenByIndex($tokenIndex);
} else { //if not fixed token, set random one.
	setTokenByIndex(array_rand($config["tokens"]));
}

function setTokenByIndex($index){
	global $config;
	
	$config["token"] = $config["tokens"][$index];
}

function getCurrentTokenIndex(){
	global $config;

	return array_search($config["token"], $config["tokens"]);
}

function writeLog($log) {
	global $config;
	
	file_put_contents($config["log_filename"], $log . ", " . $_SERVER['REMOTE_ADDR'] . "\n", FILE_APPEND);
}

function logSearch($query) {
	writeLog("Search, " . getTime() . ", " . $query);
}

function logDownload($title) {
	writeLog("Download, " . getTime() . ", " . $title);
}

function logStream($title) {
	writeLog("Streaming, " . getTime() . ", " . $title);
}

function getTime() {
	return date("F j, Y, g:i a");
}

function file_get_contents_with_cache($url, $setLastModifiedHeader = false){
	global $config;

	$cacheFile = getCacheFileForUrl($url);

	if (file_exists($cacheFile) && $config["cache_enabled"]) {
		$file = file_get_contents($cacheFile);

		if ($setLastModifiedHeader) {
			header("Last-Modified: " . gmdate("D, d M Y H:i:s T", filemtime($cacheFile)));
		}
	} else {
		$file = file_get_contents($url);

		//save if enabled
		if ($config["cache_enabled"]) {
			file_put_contents($cacheFile, $file, LOCK_EX);
		}
	}

	return $file;
}

function removeCacheForUrl($url){
	unlink(getCacheFileForUrl($url));
}

function getCacheFileForUrl($url){
	global $config;

	return $config["cache_folder"] . "/" . md5($url) . ".json";
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
	$strip = array("~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "=", "+", "[", "{", "]", "}", "\\", "|", ";", ":", "\"", "'", "&#8216;", "&#8217;", "&#8220;", "&#8221;", "&#8211;", "&#8212;", "—", "–", ",", "<", ".", ">", "/", "?");
	$clean = trim(str_replace($strip, "", strip_tags($string)));
	// $clean = preg_replace('/\s+/', "-", $clean);
	$clean = ($anal ? preg_replace("/[^a-zA-Z0-9]/", "", $clean) : $clean);
	$clean = ($trunc ? substr($clean, 0, $trunc) : $clean);
	return ($force_lowercase) ? (function_exists('mb_strtolower')) ? mb_strtolower($clean, 'UTF-8') : strtolower($clean) : $clean;
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
	global $config;
	
	header('HTTP/1.0 404 Not Found');
	//your not found file
	readfile($config["not_found_file_path"]);
	exit();
}
?>