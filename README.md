Music
=====

Search and Download free music from VK. Using VK [audio search api](https://vk.com/dev/audio.search).

## Demo
[datmusic](https://datmusic.xyz)
![Demo Screenshot](https://dotjpg.co/XfNk.png)

## Setup
* Clone project to your server
* Create "dl" folder with read & write permissions
* Change your app url in js/app.js (in config)
* Get your token ([instructions](https://github.com/alashow/music/blob/master/js/app.js#L33))
* Update your token in app.js and in php files.
* Minify app.js to app.min.js or just change link to js in index.html

## Android Version repo
[Android Version repo](https://github.com/alashow/music-android)

## Pretty url mode
Pretty url mode converts [long links with long numbers](https://datmusic.xyz/download.php?audio_id=16051160_137323200) links to ["pretty" links](https://datmusic.xyz/JjGBD:AEnvc). [converter gist](https://gist.github.com/alashow/07d9ef9c02ee697ab47d)

Rewrite example for nginx:
```
location / {
  rewrite "^/(-?\w{0,20}:\w{0,20})$" /download.php?id=$1 last;
  rewrite "^/stream/(-?\w{0,20}:\w{0,20})$" /download.php?stream=true&id=$1 last;
}
```

## License

             DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                      Version 2, December 2004

    Copyright (C) 2014 Alashov Berkeli <yunus.alashow@gmail.com>

    Everyone is permitted to copy and distribute verbatim or modified
    copies of this license document, and changing it is allowed as long
    as the name is changed.

             DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
    TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

    0. You just DO WHAT THE FUCK YOU WANT TO.

