module.exports = function(pluto) {
    var muzik = require("./muzikdriver.js");
    var player = {};

    pluto.addListener("music::play", function(song) {
        muzik.getLink(song, function(name,url) {
            var command = "curl \"" + url.shellEscape()+"\" > song.mp3";
            exec(command, {async: true}, function(code, output) {
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
