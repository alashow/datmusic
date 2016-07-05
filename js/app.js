/* ========================================================================
 * Music v1.4.0
 * https://github.com/alashow/music
 * ======================================================================== */

$(document).ready(function($) {

    $(document).keydown(function(e) {
        if (!$('#query').is(':focus')) {
            var unicode = e.charCode ? e.charCode : e.keyCode;
            if (unicode == 39) {
                playNext();
                track('button', 'next');
            } else if (unicode == 37) {
                playPrev();
                track('button', 'prev');
            }
        };
    });

    $('#player').affix({
        offset: {
            top: 400,
            bottom: function() {
                return (this.bottom = $('.footer').outerHeight(true))
            }
        }
    });

    /* ========================================================================
     * To get your own token follow instructions at https://github.com/alashow/music/wiki#how-to-get-your-own-token
     * ======================================================================== */
    // Default config for vk audio.search api
    var vkConfig = {
        url: "https://api.vk.com/method/audio.search", /*base url*/
        autoComplete: 1, /*to correct for mistakes in the search query (Beetles->Beatles)*/
        accessToken: "fff9ef502df4bb10d9bf50dcd62170a24c69e98e4d847d9798d63dacf474b674f9a512b2b3f7e8ebf1d69", /*this token might not work*/
        count: 300 // 300 is limit of vk api
    };

    var config = {
        title: "datmusic", //will be changed after i18n init
        appUrl: window.location.protocol + "//datmusic.xyz/",
        downloadServerUrl: window.location.protocol + "//datmusic.xyz/", //change if download.php file located elsewhere
        proxyMode: true, //when proxyMode enabled, search will performed through server (search.php), advantages of proxyMode are: private accessToken, less captchas. Disadvantages: preview of audio will be slower
        proxyDownload: true, //enable to download with download.php, disable to download from vk. Note: doesn't work when config.proxyMode enabled.
        captchaProxy: true, //in some countries(for ex. in China, or Turkmenistan) vk is fully blocked, captcha images won't show.
        captchaProxyUrl: "https://dotjpg.co/timthumb/thumb.php?w=200&src=", //original captcha url will be appended
        prettyDownloadUrlMode: true, //converts http://datmusic.xyz/download.php?audio_id=16051160_137323200 to http://datmusic.xyz/JjGBD:AEnvc, see readme for rewriting regex
        performerOnly: false, /*default config for searching only by artist name*/
        sort: 2, /*default sort mode (1 — by duration, 2 — by popularity, 0 — by date added)*/
        oldQuery: null, /*for storing previous queries. Used to not search again with the same query*/
        defaultLang: "en",
        langCookie: "musicLang",
        sortCookie: "musicSort",
        performerOnlyCookie: "musicPerformerOnly",
        currentTrack: -1
    };

    i18n.init({
        lng: (!$.cookie(config.langCookie)) ? config.defaultLang : $.cookie(config.langCookie),
        resStore: locales,
        cookieName: config.langCookie,
    }, function(err, t) {
        $("body").i18n();
        config.title = i18n.t("title");
    });

    //render all tooltips
    $('[data-toggle="tooltip"]').tooltip();

    //Parse audioTemplate
    var audioTemplate = $('#audioTemplate').html();
    Mustache.parse(audioTemplate);

    //Download apk if android
    if ($.cookie('showAndroidDownload') === undefined) {
        
        //show again after 2 days :)
        $.cookie('showAndroidDownload', false, {
            expires: 2
        });

        var ua = navigator.userAgent.toLowerCase();
        var isAndroid = ua.indexOf("android") > -1;
        if (isAndroid) {
            var r = confirm(i18n.t("apkDownload"));
            if (r == true) {
                track('android', "confirm");
                var win = window.open("https://bitly.com/M-APK", '_blank');
                win.focus();
            } else {
                track('android', "deny");
            }
        }
    };

    //Settings
    $('#settings').on('click', function(event) {
        $('#settingsModal').modal("show");
    });

    //set selected settings, please.
    $('#languageSelect').val(i18n.lng());

    if ($.cookie(config.sortCookie)) {
        $('#sortSelect').val($.cookie(config.sortCookie));
        config.sort = $.cookie(config.sortCookie);
    } else {
        $('#sortSelect').val(config.sort);
    }

    if ($.cookie(config.performerOnlyCookie) == "true") {
        $('#performerOnlyCheck').prop("checked", $.cookie(config.performerOnlyCookie));
        config.performerOnly = $.cookie(config.performerOnlyCookie);
    }

    //change language live
    $('#languageSelect').on('change', function(event) {
        i18n.setLng($(this).val(), function(err, t) {
            $("body").i18n();
            title = $('#jp_container_1').attr('title');
            $('#jp_container_1').attr('data-original-title', title);
            $('#jp_container_1').attr('title', '');
        });
    });

    //change sort type
    $('#sortSelect').on('change', function(event) {
        sortType = parseInt($(this).val());
        config.sort = sortType;
        $.cookie(config.sortCookie, sortType);
        if (config.oldQuery != null) {
            search(config.oldQuery, null, null, true);
        };
    });

    $('#performerOnlyCheck').change(function() {
        isChecked = $(this).is(':checked');
        config.performerOnly = isChecked;
        $.cookie(config.performerOnlyCookie, isChecked);

        if (config.oldQuery != null) {
            search(config.oldQuery, null, null, true);
        };
    });

    //Trigger search button when pressing enter button
    $('#query').bind('keypress', function(event) {
        if (event.keyCode == 13) {
            $('.search').trigger('click');
        };
    });

    $('.search').on('click', function(event) {
        typedQuery = $('#query').val();
        if (typedQuery == "") return; // return if query empty
        search(typedQuery, null, null, true);
    });

    // Initialize player
    $("#jquery_jplayer_1").jPlayer({
        swfPath: config.appUrl + "js",
        supplied: "mp3",
        wmode: "window",
        smoothPlayBar: true,
        keyEnabled: true,
        remainingDuration: true,
        toggleDuration: true,
        volume: 1,
        keyBindings: {
            play: {
                key: 32, // p
                fn: function(f) {
                    track('button', 'play/pause');
                    if (f.status.paused) {
                        f.play();
                    } else {
                        f.pause();
                    }
                }
            }
        },
        ended: function() {
            itemCount = $('.list-group-item').length;
            console.log("#" + config.currentTrack + " ended, audios count in dom = " + itemCount);
            playNext();
        },
        //sync playing/paused status with audio element
        play: function(){
            currentTrackEl = $($('.list-group-item')[config.currentTrack]).find('.play');
            $(el).find('.glyphicon').addClass('glyphicon-pause');
            $(el).find('.glyphicon').removeClass('glyphicon-play');
        },
        pause: function(){
            currentTrackEl = $($('.list-group-item')[config.currentTrack]).find('.play');
            $(el).find('.glyphicon').addClass('glyphicon-play');
            $(el).find('.glyphicon').removeClass('glyphicon-pause');    
        }
    });

    window.onpopstate = function(event) {
        searchFromQueryParam();
        console.log(event);
    };

    if (location.hash.length > 2) {
        var decodedQuery = decodeURIComponent(escape(window.atob(location.hash.substring(1, location.hash.length))));
        search(decodedQuery, null, null, true);
        $('#query').val(decodedQuery);
    } else if (!searchFromQueryParam()) {
        //Simulating search for demo of searching
        var artists = [
           "2 Cellos", "Agnes Obel", "Aloe Black", "Andrew Belle", "Angus Stone", "Aquilo", "Arctic Monkeys",
           "Avicii", "Balmorhea", "Barcelona", "Bastille", "Ben Howard", "Benj Heard", "Birdy", "Broods",
           "Calvin Harris", "Charlotte OC", "City of The Sun", "Civil Twilight", "Clint Mansell", "Coldplay",
           "Daft Punk", "Damien Rice", "Daniela Andrade", "Daughter", "David O'Dowda", "Dawn Golden", "Dirk Maassen",
           "Ed Sheeran", "Eminem", "Fabrizio Paterlini", "Fink", "Fleurie", "Florence and The Machine", "Gem club",
           "Glass Animals", "Greg Haines", "Greg Maroney", "Groen Land", "Halsey", "Hans Zimmer", "Hozier",
           "Imagine Dragons", "Ingrid Michaelson", "Jamie XX", "Jarryd James", "Jasmin Thompson", "Jaymes Young",
           "Jessie J", "Josef Salvat", "Julia Kent", "Kai Engel", "Keaton Henson", "Kendra Logozar", "Kina Grannis",
           "Kodaline", "Kygo", "Kyle Landry", "Lana Del Rey", "Lera Lynn", "Lights & Motion", "Linus Young", "Lo-Fang",
           "Lorde", "Ludovico Einaudi", "M83", "MONO", "MS MR", "Macklemore", "Mammals", "Maroon 5", "Martin Garrix",
           "Mattia Cupelli", "Max Richter", "Message To Bears", "Mogwai", "Mumford & Sons", "Nils Frahm", "ODESZA", "Oasis",
           "Of Monsters and Men", "Oh Wonder", "Philip Glass", "Phoebe Ryan", "Rachel Grimes", "Radiohead", "Ryan Keen",
           "Sam Smith", "Seinabo Sey", "Sia", "Takahiro Kido", "The Irrepressibles", "The Neighbourhood", "The xx",
           "Tom Odell", "VLNY", "Wye Oak", "X ambassadors", "Yann Tiersen", "Yiruma", "Young Summer", "Zack Hemsey",
           "Zinovia", "deadmau5", "pg.lost", "Ólafur Arnalds", "Нервы"
        ]

        var demoArtist = artists[Math.floor(Math.random() * artists.length)];
        search(demoArtist, null, null, false, true);
        $('#query').val(demoArtist);
    }

    //app.extra.js is for customizing site, without touching base js.
    $.getScript("js/app.extra.js");

    //Main function for search
    function search(newQuery, captcha_sid, captcha_key, analytics, performer_only) {
        config.currentTrack = -1; //reset current, so it won't play next song with wrong list

        if (newQuery.length > 1 && newQuery != config.oldQuery) {
            //change url with new query and page back support
            window.history.pushState(newQuery, $('title').html(), "?q=" + newQuery);
            //artist name for title
            document.title = newQuery.split(" -")[0] + " - " + config.title;
        };

        config.oldQuery = newQuery;

        //request params
        var data = {
            q: newQuery,
            sort: config.sort,
            auto_complete: vkConfig.autoComplete,
            access_token: vkConfig.accessToken,
            count: vkConfig.count
        };

        //add captcha params if available
        if (captcha_sid != null && captcha_key != null) {
            data.captcha_sid = captcha_sid;
            data.captcha_key = captcha_key;
        };

        //search only by artist name.
        if (performer_only) {
            data.performer_only = 1;
        } else {
            data.performer_only = config.performerOnly == true ? 1 : 0;
        }

        //set api url to our php file if proxy mode enabled
        url = config.proxyMode ? config.appUrl + "search.php" : vkConfig.url;
        $.ajax({
            url: url,
            data: data,
            method: "GET",
            dataType: "jsonp",
            cache: true,
            beforeSend: function() {
                $('#loading').show(); // Show loading
            },
            error: function() {
                appendError(i18n.t("networkError")); //Network error, ajax failed
            },
            success: function(msg) {
                if (msg.error) {
                    if (msg.error.error_code == 5) {
                        appendError(i18n.t("tokenError")); //Access token error
                    } else {
                        appendError(i18n.t("error", {
                            error: msg.error.error_msg
                        })); //Showing returned error
                    }

                    if (msg.error.error_code == 14) {
                        showCaptcha(msg.error.captcha_sid, msg.error.captcha_img); // api required captcha, showing it
                    };
                    return;
                };

                if (msg.response == 0) {
                    appendError(i18n.t("notFound")); //Response empty, audios not found 
                    return;
                };

                $('#result > .list-group').html(""); //clear list

                //appending audio items to dom
                for (var i = 1; i < msg.response.length; i++) {
                    downloadUrl = config.downloadServerUrl;
                    streamUrl = config.downloadServerUrl;
                    ownerId = msg.response[i].owner_id;
                    aid = msg.response[i].aid;

                    //little hard code :)
                    if (config.prettyDownloadUrlMode) {
                        streamUrl += "stream/";
                        //vk ownerId for groups is negative number, shit. invers it.
                        if (ownerId < 0) {
                            ownerId *= -1;
                            downloadUrl += "-";
                            streamUrl += "-";
                        }
                        prettyId = encode(ownerId) + ":" + encode(aid)
                        downloadUrl += prettyId;
                        streamUrl += prettyId;
                    } else {
                        downloadUrl += "download.php?audio_id=" + ownerId + "_" + aid;
                        streamUrl += "download.php?stream=true&audio_id=" + ownerId + "_" + aid;
                    }

                    audioTitle = msg.response[i].artist + ' - ' + msg.response[i].title;
                    audioDuration = msg.response[i].duration.toTime();

                    audioView = {
                        "clickToPlay": i18n.t("clickToPlay"),
                        "clickToDownload": i18n.t("clickToDownload"),
                        "durationSeconds": msg.response[i].duration,
                        "duration": msg.response[i].duration.toTime(),
                        "url": {
                            "stream": config.proxyMode ? streamUrl : msg.response[i].url,
                            "download": {
                                "original": (!config.proxyMode && !config.proxyDownload) ? msg.response[i].url : downloadUrl, //if both proxyMode and proxyDownload mode is disabled, then give direct vk url. otherwise, php downloader one.
                                "64": downloadUrl + (config.prettyDownloadUrlMode ? "/64" : "&bitrate=64"),
                                "128": downloadUrl + (config.prettyDownloadUrlMode ? "/128" : "&bitrate=128"),
                                "192": downloadUrl + (config.prettyDownloadUrlMode ? "/192" : "&bitrate=192"),
                                "320": downloadUrl + (config.prettyDownloadUrlMode ? "/320" : "&bitrate=320")
                            }
                        },
                        "audio": msg.response[i].artist + ' - ' + msg.response[i].title
                    };

                    audioRendered = Mustache.render(audioTemplate, audioView);
                    $('#result > .list-group').append(audioRendered);
                };

                //tracking search query
                track('search', newQuery);

                //hide dat thing after all
                $('#loading').hide();

                onListRendered();
            }
        });
    }

    function onListRendered() {
        //set listeners
        $('.play').on('click', function(event) {
            play($(".list-group-item").index($(this).parent()));
        });

        //showing fileSize and bitrate on dropdown shown
        $('.badge-download').on('shown.bs.dropdown', function() {
            dropdown = $(this);
            infoEl = $(dropdown.find('.info-link')[0]);

            link = infoEl.attr('data-stream');
            duration = parseInt($(infoEl).attr('data-duration'));

            if (!config.proxyMode && !config.proxyDownload) { //if proxies are not enabled, we can't show fileSize and bitrate. So just Change dots/linkText to 'Download'
                infoEl.text(i18n.t("clickToDownload"));
            } else if (infoEl.text() == "...") { //if it's not shown yet
                getFileSize(link, function(sizeInBytes) {
                    bitrate = parseInt(sizeInBytes / duration / 120);
                    info = humanFileSize(sizeInBytes, true) + ", ~" + bitrate + " kbps";
                    infoEl.text(info);
                });
            };
        });

        $('.badge-download a').on('click', function() {
            if ($(this).attr('href') != "#") {
                if ($(this).hasClass('info-link')) {
                    track("download", "bitrate = default")
                } else {
                    bitrate = $(this).text().replace(/[^\d.]/g, ''); //extracting integers, if any

                    if (bitrate.length == 0) {
                        track("download", "bitrate = default")
                    } else {
                        track("download", "bitrate = " + bitrate)
                    }
                }
            }
        });
    }

    /**
     *  Play next track.
     **/
    function playNext() {
        if (0 > config.currentTrack) {
            return; //there no music currently playing.
        };

        itemCount = $('.list-group-item').length - 1;
        if (config.currentTrack + 1 <= itemCount) {
            play(config.currentTrack + 1);
        } else { //else play first track
            console.log('seems like there no audios to play, i think. playing first one.');
            play(0);
        }

        track('play', "next");
    }

    /**
     *  Play previous track
     **/
    function playPrev() {
        if (0 > config.currentTrack) {
            return; //there no music currently playing.
        };

        if (config.currentTrack - 1 >= 0) {
            play(config.currentTrack - 1);
        } else { //else play last track
            console.log('this is first audio, nothing in back. playing last one.');
            itemCount = $('.list-group-item').length - 1;
            play(itemCount);
        }

        track('play', "prev");
    }

    /**
     * Set audio, play, show, set index, restate audios.
     * @param index of audio, in .list-group-item
     **/
    function play(index) {
        el = $($('.list-group-item')[index]).find('.play');

        //pause/play if clicked to current
        if (index == config.currentTrack) {
            if (!$('#jquery_jplayer_1').data().jPlayer.status.paused) {
                $("#jquery_jplayer_1").jPlayer("pause");
                $(el).find('.glyphicon').removeClass('glyphicon-pause');
                $(el).find('.glyphicon').addClass('glyphicon-play');
            } else {
                $("#jquery_jplayer_1").jPlayer("play");
                $(el).find('.glyphicon').removeClass('glyphicon-play');
                $(el).find('.glyphicon').addClass('glyphicon-pause');
            }
            return;
        };


        if (!el.length) {
            console.log("#" + index + " audio not found in dom")
            return;
        };

        $("#jquery_jplayer_1").jPlayer("setMedia", {
            mp3: $(el).parent().find('a.name').attr('data-src')
        });

        //set text of current audio to player
        $('.jp-audio .jp-current-name').text($(el).parent().find('a.name').text());

        //do magic
        $("#jquery_jplayer_1").jPlayer("play");
        $('#jp_container_1').show();
        $('#player-space').show();

        //set current track index
        config.currentTrack = index;

        // changing all paused items to play
        $('.list-group').find('.glyphicon-pause').each(function(index, e) {
            $(e).removeClass('glyphicon-pause');
            $(e).addClass('glyphicon-play');
        });

        //change current audio to playing state
        $(el).find('.glyphicon').removeClass('glyphicon-play');
        $(el).find('.glyphicon').addClass('glyphicon-pause');

        track('playAudio', $($('.list-group-item')[index]).find('a.name').html());
    }

    //Clear list and append given error
    function appendError(error) {
        $('#result > .list-group').html("");
        $('#result > .list-group').append('<li class="list-group-item list-group-item-danger">' + error + '</li>');
        $('#loading').hide();
    }

    /**
     * @return isSearched from query param
     **/
    function searchFromQueryParam() {
        paramQuery = getParameterByName("q");
        if (paramQuery.length > 1) {
            search(paramQuery, null, null, true);
            $('#query').val(paramQuery);
            return true;
        } else {
            return false;
        }
    }

    //Showing captcha with given captcha id and image
    function showCaptcha(captchaSid, captchaImage) {

        if (config.captchaProxy) {
            captchaImage = config.captchaProxyUrl + captchaImage;
        }

        $('#captchaModal').modal("show");
        $('#captchaImage').attr('src', captchaImage);

        //refresh captcha onclick
        $('#captchaImage').on('click', function(event) {
            $(this).attr('src', captchaImage);
        });

        //Searching with old query and captcha
        $('#captchaSend').on('click', function() {
            $('#captchaModal').modal("hide");
            search($('#query').val(), captchaSid, $('#captchaKey').val(), true);
        });

        //trigger send click after pressing enter button
        $('#captchaKey').bind('keypress', function(event) {
            if (event.keyCode == 13) {
                $('#captchaSend').trigger('click');
            };
        });

        track('captcha');
    }

    /**
     * @param query param name
     * @return query param value
     **/
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function getFileSize(url, callback) {
        var request = new XMLHttpRequest();
        //get only header.
        request.open("HEAD", url, true);
        request.onreadystatechange = function() {
            if (this.readyState == this.DONE) {
                callback(parseInt(request.getResponseHeader("Content-Length")));
            }
        };
        request.send();
    }

    function track(type, value) {
        try {
            if (ga) {
                ga('send', 'event', type, value);
            };
        } catch (e) {
            console.error("outer", e.message);
        }
    }

    //Sec To Time
    Number.prototype.toTime = function() {
        var sec_num = parseInt(this, 10);
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        var time = minutes + ':' + seconds;
        return time;
    }

    //http://stackoverflow.com/a/14919494/2897341
    function humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si ? ['kB', 'MB', 'GB'] : ['KiB', 'MiB', 'GiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    }

    // https://gist.github.com/alashow/07d9ef9c02ee697ab47d
    var map = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
        'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
        'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
        'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'x', 'y', 'z', '1', '2', '3'
    ];

    function encode(input) {
        length = map.length;
        var encoded = "";

        if (input == 0)
            return map[0];

        while (input > 0) {
            val = parseInt(input % length);
            input = parseInt(input / length);
            encoded += map[val];
        }

        return encoded;
    }
    // end code from gist
});