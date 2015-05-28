module.exports = function(pluto) {
    var spotify = {};

    spotify.listeners = {
        "music::play": function(song) {
            exec("bin/sp.sh search " + song.name + " " + song.artist);
        }
    };

    return spotify;
};
