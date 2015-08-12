module.exports = function(pluto) {
    var muzik = require("./muzikdriver.js");
    var player = {};

    pluto.addListener("music::play", function(song) {
        muzik.getLink(song.name + " " + song.artist, function(url) {
            console.log(url);
            exec("curl " + url.shellEscape(), {async: true}, function(code, output) {
                if (code == 0) {
                    console.log("downloaded file");
                } else {
                    console.log("error");
                }
            })
        });
    });

    return player;
}
