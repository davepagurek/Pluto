module.exports = function(pluto) {
    var spotify = {};

    pluto.addListener("music::play", function(song) {
        exec("bin/sp.sh search \"" + song.name.shellEscape() + " " + song.artist.shellEscape() + "\"");
    });

    return spotify;
};
