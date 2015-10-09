/* ========================================================================
 * Music v1.2.0
 * https://github.com/alashow/music
 * ======================================================================== */
$(document).ready(function($) {

    /* ========================================================================
     * To get your own token you need first create vk application at https://vk.com/editapp?act=create
     * Then  get your APP_ID and CLIENT_SECRET at application settings
     * Now open this url from your logined to vk browser, this will redirect to blank.html with your token:
     * https://oauth.vk.com/authorize?client_id=APP_ID&client_secret=CLIENT_SECRET&scope=audio,offline&response_type=token
     * ======================================================================== */
    // Default config for vk audio.search api
    var vkConfig = {
        url: "https://api.vk.com/method/audio.search",
        autoComplete: 1,
        accessToken: "e9dbafe947e48136f15bbaf1184095282f53bb146441910421e180b46fa6cf6cf8c37f7de3f525d2c121d",
        count: 300 // 300 is limit of vk api
    };

    var config = {
        appPath: "http://alashov.com/music/",
        performerOnly: false,
        liveSearch: false,
        sort: 2,
        prettyDownloadUrlMode: false, //converts http://alashov.com/music/download.php?audio_id=16051160_137323200 to http://alashov.com/music/JjGBD:AEnvc, see readme for rewriting regex
        oldQuery: null,
        defaultLang: "en",
        langCookie: "musicLang",
        sortCookie: "musicSort",
        performerOnlyCookie: "musicPerformerOnly",
        liveSearchCookie: "musicLiveSearch"
    };

    i18n.init({
        lng: (!$.cookie(config.langCookie)) ? config.defaultLang : $.cookie(config.langCookie),
        resStore: locales,
        cookieName: config.langCookie,
    }, function(err, t) {
        $("body").i18n();
    });

    //Download apk if android
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1;
    if (isAndroid) {
        var r = confirm(i18n.t("apkDownload"));
        if (r == true) {
            var win = window.open("http://bitly.com/M-APK", '_blank');
            win.focus();
        }
    }

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

    if ($.cookie(config.liveSearchCookie) == "true") {
        $('#liveSearchCheck').prop("checked", $.cookie(config.liveSearchCookie));
        config.liveSearch = $.cookie(config.liveSearchCookie);
    }

    //change language live
    $('#languageSelect').on('change', function(event) {
        i18n.setLng($(this).val(), function(err, t) {
            $("body").i18n();
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

    $('#liveSearchCheck').change(function() {
        isChecked = $(this).is(':checked');
        config.liveSearch = isChecked;
        $.cookie(config.liveSearchCookie, isChecked);
    });

    //Trigger search button when pressing enter button
    $('#query').bind('keypress', function(event) {
        if (event.keyCode == 13) {
            $('.search').trigger('click');
        };
    });

    $('#query').on('keypress', function(event) {
        if (config.liveSearch) {
            $('.search').trigger('click');
        };
    });

    $('.search').on('click touchstart', function(event) {
        typedQuery = $('#query').val();
        if (typedQuery == "") return; // return if query empty
        search(typedQuery, null, null, true);
    });

    // Initialize player
    $("#jquery_jplayer_1").jPlayer({
        swfPath: config.appPath + "js",
        supplied: "mp3",
        wmode: "window",
        smoothPlayBar: true,
        keyEnabled: true,
        remainingDuration: true,
        toggleDuration: true,
        volume: 1
    });
    $('[data-toggle="tooltip"]').tooltip();

    window.onpopstate = function(event) {
        searchFromQueryParam();
        console.log(event);
    };

    if (!searchFromQueryParam()) {
        //Simulating search for demo of searching
        var artists = [
            "Kygo", "Ed Sheeran", "Toe",
            "Coldplay", "The xx", "MS MR", "Macklemore",
            "Lorde", "Birdy", "Seinabo Sey", "Sia", "M83",
            "Hans Zimmer", "Keaton Henson", "Yiruma", "Martin Garrix",
            "Calvin Harris", "Zinovia", "Avicii", "Of Monsters and Men",
            "Josef Salvat", "Sam Smith", "deadmau5", "Yann Tiersen",
            "Jessie J", " Maroon 5", "X ambassadors", "Fink",
            "Young Summer", "Lana Del Rey", "Arctic Monkeys",
            "Ludovico Einaudi", "Lera Lynn", "Bastille",
            "Nils Frahm", "Ben Howard", "Andrew Belle",
            "Mumford & Sons", "Ryan Keen", "Zes", "Greg Haines",
            "Max Richter"
        ]
        var demoArtist = artists[Math.floor(Math.random() * artists.length)];
        search(demoArtist, null, null, false, true);
        $('#query').val(demoArtist);
    }

    //Main function for search
    function search(newQuery, captcha_sid, captcha_key, analytics, performer_only) {
        if (newQuery.length > 1 && newQuery != config.oldQuery) {
            //change url with new query and page back support
            window.history.pushState(newQuery, $('title').html(), "?q=" + newQuery);
            //artist name for title
            document.title = newQuery.split(" -")[0] + " - Alashov Music";
        };

        config.oldQuery = newQuery;

        var data = {
            q: newQuery,
            sort: config.sort,
            auto_complete: vkConfig.autoComplete,
            access_token: vkConfig.accessToken,
            count: vkConfig.count
        };

        if (captcha_sid != null && captcha_key != null) {
            data.captcha_sid = captcha_sid;
            data.captcha_key = captcha_key;
        };

        //search only by artist name
        if (performer_only) {
            data.performer_only = 1;
        } else {
            data.performer_only = config.performerOnly == true ? 1 : 0;
        }

        $.ajax({
            url: vkConfig.url,
            data: data,
            method: "GET",
            dataType: "jsonp",
            cache: true,
            beforeSend: function() {
                $('#loading').show(); // Show loading
            },
            error: function() {
                appendError(i18n.t("networError")); //Network error, ajax failed
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

                //appending new items to list
                for (var i = 1; i < msg.response.length; i++) {

                    downloadUrl = config.appPath;
                    ownerId = msg.response[i].owner_id;
                    aid = msg.response[i].aid;

                    //little hard code :)
                    if (config.prettyDownloadUrlMode) {
                        //vk ownerId for groups is negative number, shit. invers it.
                        if (ownerId < 0) {
                            ownerId *= -1;
                            downloadUrl += "-";
                        }
                        downloadUrl += encode(ownerId) + ":" + encode(aid);
                    } else {
                        downloadUrl += "download.php?audio_id=" + ownerId + "_" + aid;
                    }

                    audioTitle = msg.response[i].artist + ' - ' + msg.response[i].title;
                    audioDuration = msg.response[i].duration.toTime();

                    $('#result > .list-group')
                        .append('<li class="list-group-item"><span class="badge">' + audioDuration + '</span><span class="badge play" data-i18n="[title]clickToPlay"><span class="glyphicon glyphicon-play"></span></span><a data-i18n="[title]clickToDownload" target="_blank" data-src="' + msg.response[i].url + '" href="' + downloadUrl + '">' + audioTitle + '</a></li>');
                };
                $(".list-group").i18n();

                //tracking search query
                if (analytics) {
                    try {
                        ga('send', 'event', 'search', _query);
                    } catch (e) {}
                };

                $('.play').on('click', function(event) {

                    //Change source of audio, play then show
                    $("#jquery_jplayer_1").jPlayer("setMedia", {
                        mp3: $(this).parent().find('a').attr('data-src')
                    });

                    $("#jquery_jplayer_1").jPlayer("play");
                    $('#jp_container_1').show();
                    window.scrollTo(0, 0);
                });
                $('#loading').hide();
            }
        });
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
        //Tracking captchas
        try {
            ga('send', 'event', 'captcha');
        } catch (e) {}
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

    function decode(encoded) {
        length = map.length;
        decoded = 0;

        for (i = encoded.length - 1; i >= 0; i--) {
            ch = encoded[i];
            val = map.indexOf(ch);
            decoded = (decoded * length) + val;
        }

        return decoded;
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
});