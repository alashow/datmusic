Music
=====

Search and Download free music from VK. Using VK [audio search api](https://vk.com/dev/audio.search).

## Demo
[datmusic](https://datmusic.xyz)
![Demo Screenshot](https://i.imgur.com/LuT7F86.png)

[Usage wiki](https://github.com/alashow/music/wiki)

## Android Version repo
[Android Version repo](https://github.com/alashow/music-android)

## Telegram Bot repo
[Telegram Bot repo](https://github.com/alashow/datmusicbot)

## Code

Currently code is divided to two parts: 
- javascript side. 
	- makes requests to server (either to php side or directly to VK API, configurable from js).
	- renders result to DOM with mustache js.
	- Shows captcha to user if returned error with captcha code. VK throws captchas errors for several reasons: requests from with different IP's but same token (I suggest you use PHP side for server side).
		- You can enable PHP code for server side by setting true in config.proxyMode (app.js).
	- Plays audios with jPlayer.
		- Plays next audio after finish.
	- Handles settings (language change, search settings etc).
- php side.
	- Downloads music to server and serves it as mp3 file (force download)
		- Input is audioId and userId. Since we need url of mp3, artist and audio title it makes request to VK API.
			- Deals with captcha too. When VK APi returns captcha error, it returned 404 as HTTP Status and shows captcha for entering captcha, then user can retry downloading.
		- It doesn't delete saved mp3 after serving. You need to purge cache manually (you can use cronjobs, for example).
		- mp3 files saved as md5 of audioId.
		- Files served in proper name (Artist - Title.mp3).
		- If bitrate given, converts mp3's with ffmpeg and serves it converted one (useful for users who has limited data plan).
	- Stream mp3's for js player.
		- Works just as downloading, but redirects to mp3 file after downloading it to server.
	- Work as proxy for VK.
		- Uses private token set in php config.
		- Redirects all given input queries to VK APi.
		- Caches results as json files. Need to purge cache manually too, as mp3's. I suggest to purge them in 1-2 days, because vk changes links to mp3 files for somereason :) (for security reasons I guess, downloads won't work if you don't clear cache).

# License
MIT - Alashov Berkeli

