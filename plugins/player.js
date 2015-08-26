module.exports = function(pluto) {
    var MIN_MB = 3;

    var muzik = require("./muzikdriver.js");
    var request = require('request');
    var player = {};
    var fs = require('fs');
    var songs = pluto.getStorage("songs");
    var downloading = pluto.getStorage("songs_downloading");

    pluto.addListener("music::play", function(song) {
        var songURL = "storage/songs/" + song.id + ".mp3";
        var playCommand = "mkfifo /tmp/mplayer-control;mplayer -slave -input file=/tmp/mplayer-control " + songURL;
        if (test("-f", songURL)) {
            console.log("Song file exists");
            exec(playCommand, {async:true},function(code,output){
                if (code == 0) {
                    console.log("playing");
                } else {
                    console.log("error, deleting file");
                    rm(songURL);
                    pluto.emitEvent("music::play", song);
                }
            });
        } else {
            console.log("getting song urls");
            songs[song.id] = songs[song.id] || {ignore: []};
            muzik.getLink(song, songs[song.id].ignore, function(name,url) {
                request.head(url, function(err, res, body) {
                    if (err || res.headers['content-type'].indexOf("audio") == -1 || res.headers['content-length']/1000000 < MIN_MB) {
                        songs[song.id].ignore.push(url);
                        pluto.saveStorage("songs");
                        pluto.emitEvent("music::play", song);
                    } else {
                        downloading.song = song;
                        request(url).pipe(fs.createWriteStream(songURL)).on('close', function() {
                            console.log("Downloaded file");
                            downloading.song = null;

                            exec(playCommand, {async:true},function(code,output){
                                if (code == 0) {
                                    console.log("playing");
                                } else {
                                    songs[song.id].ignore.push(url);
                                    pluto.saveStorage("songs");
                                    pluto.emitEvent("music::play", song);
                                }
                            });
                        });
                    }
                });
            });
        }
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


    pluto.get("/music/downloading", function(req, res) {
        res.render("songs_downloading.html", {
            "song": downloading.song,
            "layout": false
        });
    });

    return player;
}
