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
        clientId: 4548044,
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
        var query = $('#query').val();

        if (query == "") return;

        $.ajax({
            url: vkConfig.url,
            data: {
                q: query,
                sort: vkConfig.sort,
                auto_complete: vkConfig.autoComplete,
                //access_token: vkConfig.accessToken,
                client_id: vkConfig.clientId,
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
                if (msg.response == 0) {
                    $('#result > .list-group').append('<li class="list-group-item list-group-item-danger">Beýle aýdym ýok!</li>');
                    $('#loading').hide();
                    return;
                };

                for (var i = 1; i < msg.response.length; i++) {
                    $('#result > .list-group').append('<a class="list-group-item"  target="_blank" href="' + msg.response[i].url + '">' + msg.response[i].artist + ' - ' + msg.response[i].title + '</a>');
                };
                $('#loading').hide();
            }
        });
    });
});