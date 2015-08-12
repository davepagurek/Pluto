var muzikdriver  = require('./muzikdriver.js')
module.exports = function(pluto) {
    var muzic = {};

    pluto.addListener("music::play", function(song) {
        //exec("bin/muzik.sh \"" + song.name.shellEscape() + " " + song.artist.shellEscape() + "\"");
      muzikdriver("bitch im madonna",function(body){
        exec('mplayer '+ body.url[0].url)
      });
    });

    return muzic;
};
