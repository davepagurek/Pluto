module.exports = function(pluto) {
    var muzik = require("./muzikdriver.js");
    var player = {};
    var index = 0;
    pluto.addListener("music::play", function(song) {
        muzik.getLink(song, index++, function(name,url) {
            var command = "curl \"" + url.shellEscape()+"\" > song.mp3";
            exec(command, {async: true}, function(code, output) {
                if (code == 0) {
                    console.log("Downloaded file");
                    var playCommand = "mkfifo /tmp/mplayer-control;mplayer -slave -input file=/tmp/mplayer-control song.mp3";
                    exec(playCommand, {async:true},function(code,output){
                      if (code == 0){
                        console.log("playing");
                      }else{
                        pluto.emitEvent("music::play", song);
                      }
                    })
                } else {
                    console.log("error trying another link");
                    pluto.emitEvent("music::play", song);
                }
            })
        });
    });
    function toggleSong(){
    }
    pluto.addListener("music::pause",function(song){
      var pausecommand = "echo \"pause\"> /tmp/mplayer-control";
      exec(pausecommand, {async:true},function(code,output){
        console.log("send pause command");
      })
    });

    pluto.addListener("music::resume",function(song){
      var pausecommand = "echo \"pause\"> /tmp/mplayer-control";
      exec(pausecommand, {async:true},function(code,output){
        console.log("send resume command");
      })
    });

    pluto.addListener("music::stop",function(){
      var stopcommand = "echo \"stop\" > /tmp/mplayer-control";
      exec(stopcommand, {async:true}, function(code, output){
        console.log("stop song");
      })
    });
    return player;
}
