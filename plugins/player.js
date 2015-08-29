module.exports = function(pluto) {
    var MIN_MB = 3;

    var muzik = require("./muzikdriver.js");
    var request = require('request');
    var progress = require('request-progress');
    var spawn = require( 'child_process' ).spawn;
    var fs = require('fs');

    var player = {};
    var songs = pluto.getStorage("songs");
    var downloading = null;
    var downloadPercent = null;
    var mplayer = null;
    var sentStop = false;

    var playSong = function(songURL, song, url) {
        mplayer = spawn( 'mplayer', [ '-slave', songURL ] );
        mplayer.on('exit', function (response) {
            songProgress = null;
            mplayer = null;
            if (response == 0) {
                console.log("Finished playing");
                if (sentStop) {
                    sentStop = false;
                } else {
                    pluto.emitEvent("music::next");
                }
            } else {
                console.log("Can't play file, got response: " + response);
                rm(songURL);
                if (url) songs[song.id].ignore.push(url);
                pluto.emitEvent("music::play", song);
            }
        });

        //Output format:
        //13.7 (13.7) of 284.0 (04:44.0)
        mplayer.stdout.on('data', function (data) {
            var match = /([\d\.:]+) \([\d\.:]+\) of ([\d\.]+) \([\d\.:]+\)/.exec(data);
            if (match) {
                pluto.emitEvent("player::progress", {
                    current: parseInt(match[1]),
                    total: parseInt(match[2])
                });
            }
        });
    };

    pluto.addListener("music::play", function(song) {
        var songURL = "storage/songs/" + song.id + ".mp3";
        var playCommand = "mkfifo /tmp/mplayer-control; mplayer -slave -input file=/tmp/mplayer-control " + songURL;
        if (test("-f", songURL)) {
            console.log("Song file exists");
            playSong(songURL, song);
        } else {
            console.log("getting song urls");
            songs[song.id] = songs[song.id] || {ignore: []};
            muzik.getLink(song, songs[song.id].ignore, function(name,url) {
                request.head(url, function(err, res, body) {
                    if (err ||
                        !res.headers['content-type'] || !res.headers['content-length'] ||
                        res.headers['content-type'].indexOf("audio") == -1 || res.headers['content-length']/1000000 < MIN_MB) {
                        songs[song.id].ignore.push(url);
                        pluto.saveStorage("songs");
                        pluto.emitEvent("music::play", song);
                    } else {
                        downloading = song;
                        console.log("Starting download");
                        progress(request(url), {
                            throttle: 200
                        })
                        .on("error", function(err) {
                            songs[song.id].ignore.push(url);
                            pluto.saveStorage("songs");
                            pluto.emitEvent("music::play", song);
                        })
                        .on("progress", function(state) {
                            downloadPercent = state.percent;
                        })
                        .pipe(fs.createWriteStream(songURL)).on('close', function() {
                            console.log("Downloaded file");
                            downloading = null;
                            playSong(songURL, song, url);
                        });
                    }
                });
            });
        }
    });
    pluto.addListener("music::pause",function(song){
        if (!mplayer) return;
        console.log("Pausing");
        mplayer.stdin.write("pause\n");
    });

    pluto.addListener("music::resume",function(song){
        if (!mplayer) return;
        console.log("Resuming");
        mplayer.stdin.write("pause\n");
    });

    pluto.addListener("music::stop",function(){
        if (!mplayer) return;
        console.log("Stopping");
        sentStop = true;
        mplayer.stdin.write("stop\n");
    });


    pluto.get("/music/downloading", function(req, res) {
        res.render("songs_downloading.html", {
            "song": downloading,
            "percent": downloadPercent,
            "layout": false
        });
    });

    return player;
}
