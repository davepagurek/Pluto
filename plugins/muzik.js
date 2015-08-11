module.exports = function(pluto) {
    var muzic = {};

    pluto.addListener("music::play", function(song) {
        exec("bin/muzik.sh \"" + song.name.shellEscape() + " " + song.artist.shellEscape() + "\"");
    });

    return muzic;
};
