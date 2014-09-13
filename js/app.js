$(document).ready(function($) {

    $('#query').bind('keypress', function(event) {
        if (event.keyCode == 13) {
            $('.search').trigger('click');
        };
    });

    var vkConfig = {
        url: "https://api.vk.com/method/audio.search",
        sort: 2,
        autoComplete: 1,
        accessToken: "7b8da9a6d2cf68a045cfbbcd93113f74375de40c19e5393809950ef5a3bccb0285eedfc56fcc96c2b3658",
        count: 300
    }

    var lastFmConfig = {
        url: "http://ws.audioscrobbler.com/2.0/",
        method: "artist.search",
        apiKey: "8b7af513f19366e766af02c85879b0ac",
        format: "json",
        limit: 10
    }

    $("#query").autocomplete({
        source: function(request, response) {
            jQuery.get(lastFmConfig.url, {
                method: lastFmConfig.method,
                api_key: lastFmConfig.apiKey,
                format: lastFmConfig.format,
                limit: lastFmConfig.limit,
                artist: request.term
            }, function(data) {
                var array = [];
                if (data.results.artistmatches.artist != undefined) {
                    for (var i = 0; i < data.results.artistmatches.artist.length; i++) {
                        array.push(data.results.artistmatches.artist[i].name);
                    }
                    response(array);
                }
            });
        },
        minLength: 3
    });
    $('.search').on('click touchstart', function(event) {
        query = $('#query').val();
        if (query == "") return;
        search(query);
    });


    //Simulating click for get popular music onload
    search("");

    function appendError(error) {
        $('#result > .list-group').append('<li class="list-group-item list-group-item-danger">' + error + '</li>');
        $('#loading').hide();
    }

    function search(_query) {
        $.ajax({
            url: vkConfig.url,
            data: {
                q: _query,
                sort: vkConfig.sort,
                auto_complete: vkConfig.autoComplete,
                access_token: vkConfig.accessToken,
                count: vkConfig.count
            },
            type: "GET",
            dataType: "jsonp",
            beforeSend: function() {
                $('#result > .list-group').html("");
                $('#loading').show();
            },
            error: function() {
                alert('Internet ýok öýdýän...');
            },
            success: function(msg) {
                if (msg.error) {
                    if (msg.error.error_code == 5) {
                        appendError("Access Token ýalňyş");
                    } else {
                        appendError("Ýalňyşlyk : " + msg.error.error_msg);
                    }
                    return;
                };

                if (msg.response == 0) {
                    appendError("Beýle aýdym ýok!");
                    return;
                };

                for (var i = 1; i < msg.response.length; i++) {
                    $('#result > .list-group').append('<a class="list-group-item"  target="_blank" href="' + msg.response[i].url + '"> <span class="badge">'+msg.response[i].duration.toTime()+'</span>' + msg.response[i].artist + ' - ' + msg.response[i].title + '</a>');
                };
                $('#loading').hide();
            }
        });
    }

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