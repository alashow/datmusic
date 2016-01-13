<?php
/* ========================================================================
 * Music v1.2.7
 * https://github.com/alashow/music
 * ======================================================================== */
 
function writeLog($log){
        file_put_contents("log", $log . ", " . $_SERVER['REMOTE_ADDR'] . "\n", FILE_APPEND);
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
?>