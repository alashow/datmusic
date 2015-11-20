<?php
/* ========================================================================
 * Music v1.2.7
 * https://github.com/alashow/music
 * ======================================================================== */
 
function writeLog($log){
        file_put_contents("log", $log . ", " . $_SERVER['REMOTE_ADDR'] . "\n", FILE_APPEND);
}
function writeSearch($query) {
        writeLog("Search, " . getTime() . ", " . $query);
}
function writeDownload($title) {
        writeLog("Download, " . getTime() . ", " . $title);
}
function writeStream($title) {
        writeLog("Streaming, " . getTime() . ", " . $title);
}
function getTime() {
        return date("F j, Y, g:i a");
}
?>