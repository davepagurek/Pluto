module.exports = function(pluto) {
    var muzik = require("./muzikdriver.js");
    var player = {};

    pluto.addListener("music::play", function(song) {
        muzik.getLink(song, [], function(name,url) {
            var command = "curl \"" + url.shellEscape()+"\" > song.mp3";
            exec(command, {async: true}, function(code, output) {
                if (code == 0) {
                    console.log("Downloaded file");
                    var playCommand = "mkfifo /tmp/mplayer-control;mplayer -slave -input file=/tmp/mplayer-control song.mp3";
                    exec(playCommand, {async:true},function(code,output){
                      console.log("playing");
                    })
                } else {
                    console.log("error");
                }
            })
        });
    });
    function toggleSong(){
    }
    pluto.addListener("music::pause",function(song){
      pausecommand = "echo \"pause\"> /tmp/mplayer-control"
      exec(pausecommand, {async:true},function(code,output){
        console.log("send pause command");
      })
    });

    pluto.addListener("music::resume",function(song){
      pausecommand = "echo \"pause\"> /tmp/mplayer-control"
      exec(pausecommand, {async:true},function(code,output){
        console.log("send resume command");
      })
    });

    return player;
}
