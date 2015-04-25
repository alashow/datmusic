/* ========================================================================
 * Music v1.1.3
 * https://github.com/alashow/music
 * ======================================================================== */
$(document).ready(function($) {
    //Trigger search button when pressing enter button
    $('#query').bind('keypress', function(event) {
        if (event.keyCode == 13) {
            $('.search').trigger('click');
        };
    });
    // Initialize player
    $("#jquery_jplayer_1").jPlayer({
        swfPath: "http://alashov.com/music/js",
        supplied: "mp3",
        wmode: "window",
        smoothPlayBar: true,
        keyEnabled: true,
        remainingDuration: true,
        toggleDuration: true,
        volume: 1
    });

    $('[data-toggle="tooltip"]').tooltip()

    /* ========================================================================
     * To get your own token you need first create vk application at https://vk.com/editapp?act=create
     * Then  get your APP_ID and CLIENT_SECRET at application settings
     * Now open this url from your logined to vk browser, this will redirect to blank.html with your token:
     * https://oauth.vk.com/authorize?client_id=APP_ID&client_secret=CLIENT_SECRET&scope=audio,offline&response_type=token
     * ======================================================================== */
    // Config for vk audio.search api
    var vkConfig = {
            url: "https://api.vk.com/method/audio.search",
            sort: 2,
            autoComplete: 1,
            accessToken: "4d45c6ebef3b05a910071c948bb1374015c9e47ad953fba2f631d8bc1fca425a0a0bffcb4955d3af90c07",
            count: 1000 // 1000 is limit of vk api
        }
        //Config for LastFm Artist Search Api
    var lastFmConfig = {
            url: "http://ws.audioscrobbler.com/2.0/",
            method: "artist.search",
            apiKey: "8b7af513f19366e766af02c85879b0ac",
            format: "json",
            limit: 10
        }
        //Autocomplete for search input
    $("#query").autocomplete({
        source: function(request, response) {
            $.get(lastFmConfig.url, {
                method: lastFmConfig.method,
                api_key: lastFmConfig.apiKey,
                format: lastFmConfig.format,
                limit: lastFmConfig.limit,
                artist: request.term
            }, function(data) {
                var array = [];
                //If artists not empty
                if (data.results.artistmatches.artist != undefined) {
                    //Adding to array artist names
                    for (var i = 0; i < data.results.artistmatches.artist.length; i++) {
                        array.push(data.results.artistmatches.artist[i].name);
                    }
                    //Showing autocomplete
                    response(array);
                }
            });
        },
        minLength: 2,
        select: function(event, ui) {
            $('.search').trigger('click'); //trigger search button after select from autocomplete
            //Tracking autocomplete
            try {
                ga('send', 'event', 'autoCompleteSelect', $('#query').val());
            } catch (e) {}
        }
    });
    $('.search').on('click touchstart', function(event) {
        query = $('#query').val();
        if (query == "") return; // return if query empty
        search(query, null, null, true);
    });

    var query = getParameterByName("q");;
    //For sharing search links, like http://alashov.com/music/?=qThe xx - Together
    if (query.length > 1) {
        search(query, null, null, true);
        $('#query').val(query);
    } else {
        //Simulating search for demo of searching
        var artists = [
            "Banks", "Kygo", "Ed Sheeran", "Toe",
            "Coldplay", "The xx", "MS MR", "Macklemore",
            "Lorde", "Birdy", "Seinabo Sey", "Sia", "M83",
            "Hans Zimmer", "Keaton Henson", "Yiruma", "Martin Garrix",
            "Calvin Harris", "Zinovia", "Avicii", "Iggy Azalea",
            "Charli XCX", "Sam Smith", "deadmau5", "Yann Tiersen",
            "Jessie J", " Maroon 5", "X ambassadors", "Fink",
            "Young Summer", "Lana Del Rey", "Arctic Monkeys"
        ]
        var demoArtist = artists[Math.floor(Math.random() * artists.length)];
        search(demoArtist, null, null, false, true);
        window.history.pushState("wtf", $('title').html(), "?q=" + demoArtist);
        $('#query').val(demoArtist);
    }

    //Append Error To List
    function appendError(error) {
        $('#result > .list-group').html("");
        $('#result > .list-group').append('<li class="list-group-item list-group-item-danger">' + error + '</li>');
        $('#loading').hide();
    }
    //Main function for search
    function search(_query, captcha_sid, captcha_key, analytics, performer_only) {
        if (query.length > 1) {
            window.history.pushState("wtf", $('title').html(), "?q=" + query);
        };
        var data = {
            q: _query,
            sort: vkConfig.sort,
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
        };
        $.ajax({
            url: vkConfig.url,
            data: data,
            type: "POST",
            dataType: "jsonp",
            beforeSend: function() {
                $('#loading').show(); // Show loading
            },
            error: function() {
                appendError('Internet ýok öýdýän...'); //Network error, ajax failed
            },
            success: function(msg) {
                if (msg.error) {
                    if (msg.error.error_code == 5) {
                        appendError("Access Token ýalňyş"); //Access token error
                    } else {
                        appendError("Ýalňyşlyk : " + msg.error.error_msg); //Showing returned error
                    }
                    if (msg.error.error_code == 14) {
                        showCaptcha(msg.error.captcha_sid, msg.error.captcha_img); // api required captcha, showing it
                    };
                    return;
                };
                if (msg.response == 0) {
                    appendError("Beýle aýdym ýok!"); //Response empty, audios not found 
                    return;
                };
                $('#result > .list-group').html(""); //clear list
                //appending new items to list
                for (var i = 1; i < msg.response.length; i++) {
                    $('#result > .list-group').append('<li class="list-group-item"><span class="badge">' + msg.response[i].duration.toTime() + '</span><span class="badge play" title="Diňlemek üçin basyň!"><span class="glyphicon glyphicon-play"></span></span><a title="Kompýutere ýüklemek üçin basyň!" target="_blank" data-src="' + msg.response[i].url + '" href="download.php?audio_id=' + msg.response[i].owner_id + '_' + msg.response[i].aid + '">' + msg.response[i].artist + ' - ' + msg.response[i].title + '</a></li>');
                };

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

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
});