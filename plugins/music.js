module.exports = function(pluto) {
    var data = pluto.getStorage("users")||{};

    var musicModule = {};

    musicModule.playing = false;

    musicModule.selectSong = function() {
        var artists = [];
        for (var user in data) {
            if (data[user].in && data[user].artists) {
                data[user].artists.forEach(function(artist) {
                    //Add artist if it doesn't already exist
                    console.log("checking artist " + artist);
                    if (artists.indexOf(artist) == -1) artists.push(artist);
                });
            }
        }
        console.log(artists);
        var selectedArtist = artists[Math.floor(Math.random()*artists.length)];
        console.log("Selected artist: " + selectedArtist);

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
