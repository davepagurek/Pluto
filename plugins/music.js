module.exports = function(pluto) {
    require('es6-promise').polyfill();
    var request = require('popsicle');

    var data = pluto.getStorage("users")||{};

    var musicModule = {};

    musicModule.playing = false;

    musicModule.selectSong = function() {
        var artists = [];
        for (var user in data) {
            if (data[user].in && data[user].artists) {
                data[user].artists.forEach(function(artist) {
                    //Add artist if it doesn't already exist
                    if (artists.indexOf(artist) == -1) artists.push(artist);
                });
            }
        }
        var selectedArtist = artists[Math.floor(Math.random()*artists.length)];
        var artist = "";
        console.log("Requesting https://api.spotify.com/v1/search?q=" + encodeURIComponent(selectedArtist) + "&type=artist");
        request("https://api.spotify.com/v1/search?q=" + encodeURIComponent(selectedArtist) + "&type=artist").then(function(res) {
            if (res.status != 200) {
                console.log("An error occurred: response " + res.status);
                return;
            }
            artist = res.body.artists.items[0];
            console.log("Requesting https://api.spotify.com/v1/artists/" + artist.id + "/top-tracks?country=US");
            request("https://api.spotify.com/v1/artists/" + artist.id + "/top-tracks?country=US").then(function(res) {
                if (res.status != 200) {
                    console.log("An error occurred: response " + res.status);
                    return;
                }
                songs = res.body.tracks;
                var selectedSong = songs[Math.floor(Math.random()*songs.length)];
                console.log("Selected song: " + selectedSong.name + " - " + selectedArtist);
            });
        });

    };

    pluto.get("/music/play", function(req, res) {
        pluto.emitEvent("music::play");
        res.send("Playing music");
    });

    musicModule.listeners = {
        "music::play": function() {
            if (!musicModule.playing) musicModule.selectSong();
        }
    };



    return musicModule;
}
