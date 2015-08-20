module.exports = function(pluto) {
    var muzik = require("./muzikdriver.js");
    var player = {};
    var songs = pluto.getStorage("songs");

    pluto.addListener("music::play", function(song) {
        songs[song.id] = songs[song.id] || {ignore: []};
        muzik.getLink(song, songs[song.id].ignore, function(name,url) {
            var command = "curl \"" + url.shellEscape()+"\" > song.mp3";
            exec(command, {async: true}, function(code, output) {
                if (code == 0) {
                    console.log("Downloaded file");
                    var playCommand = "mkfifo /tmp/mplayer-control;mplayer -slave -input file=/tmp/mplayer-control song.mp3";
                    exec(playCommand, {async:true},function(code,output){
                        if (code == 0){
                            console.log("playing");
                        }else{
                            songs[song.id].ignore.push(url);
                            pluto.saveStorage("songs");
                            pluto.emitEvent("music::play", song);
                        }
                    })
                } else {
                    console.log("error trying another link");
                    songs[song.id].ignore.push(url);
                    pluto.saveStorage("songs");
                    pluto.emitEvent("music::play", song);
                }
            })
        });
    });
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
