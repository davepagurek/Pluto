module.exports = function(pluto) {
    var MIN_MB = 3;

    var muzik = require("./muzikdriver.js");
    var request = require('request');
    var progress = require('request-progress');
    var spawn = require( 'child_process' ).spawn;
    var fs = require('fs');

    var player = {};
    var songs = pluto.getStorage("songs");
    var attempts = 0;
    var downloading = null;
    var downloadPercent = null;
    var downloadError = null;
    var mplayer = null;
    var sentStop = false;
    var badSong = false;
    var songProgress = null;

    player.handleBadSong = function(song, url) {
        console.log("Can't play file");
        rm(songs[song.id].url);
        delete songs[song.id].url;
        if (url) songs[song.id].ignore.push(url);
        badSong = true;
        pluto.emitEvent("music::play", song);
    };

    player.playSong = function(song, url) {
        console.log("got song ", song);
        mplayer = spawn( 'mplayer', [ '-slave', songs[song.id].url ] );
        mplayer.on('exit', function (response) {
            mplayer = null;
            if (response == 0) {
                console.log("Finished playing");
                if (sentStop) {
                    sentStop = false;
                    songProgress = null;
                } else if (badSong) {
                    badSong = false;
                    songProgress = null;
                } else if (!songProgress) {
                    player.handleBadSong(song, url);
                } else {
                    songProgress = null;
                    pluto.emitEvent("music::next");
                }
            } else {
                songProgress = null;
                player.handleBadSong(song, url);
            }
        });

        //Output format:
        //13.7 (13.7) of 284.0 (04:44.0)
        mplayer.stdout.on('data', function (data) {
            if (sentStop) return;
            data = "" + data;
            var progressMatch = /([\d\.:]+) \([\d\.:]+\) of ([\d\.]+) \([\d\.:]+\)/.exec(data);
            if (progressMatch) {
                songProgress = {
                    current: parseInt(progressMatch[1]),
                    total: parseInt(progressMatch[2])
                };
                pluto.emitEvent("player::progress", songProgress);
                return;
            }

            var decodeErrorMatch = /(?:decoding for stream .+ failed)|(?:no sound)/i.exec(data);
            if (decodeErrorMatch) {
                player.handleBadSong(song, url);
                return;
            }
        });
    };

    pluto.addListener("music::retry", function(song) {
        if (songs[song.id].url) {
            rm(songs[song.id].url);
            delete songs[song.id].url;
        }
        if (songs[song.id].from) {
            songs[song.id].ignore.push(songs[song.id].from);
            delete songs[song.id].from;
        }
        delete songs[song.id].from;
        pluto.emitEvent("music::play", song);
    });

    pluto.addListener("music::reset", function(song) {
        if (songs[song.id].url) {
            rm(songs[song.id].url);
            delete songs[song.id].url;
        }
        if (songs[song.id].ignore) {
            songs[song.id].ignore = [];
        }
        delete songs[song.id].from;
        pluto.emitEvent("music::play", song);
    });

    pluto.addListener("music::play", function(song) {
        downloadError = null;
        downloadPercent = null;
        downloading = song;
        attempts++;
        songs[song.id] = songs[song.id] || {ignore: []};
        songs[song.id].lastPlayed = Date.now();
        if (songs[song.id].url) {
            if (test("-f", songs[song.id].url)) {
                console.log("Song file exists");
                downloading = null;
                player.playSong(song, null);
            } else {
                delete songs[song.id].url;
                pluto.emitEvent("music::play", song);
            }
        } else {
            console.log("getting song urls");
            pluto.emitEvent("muzik::get_link", song, songs[song.id].ignore, function(err,url) {
                if (err) {
                    downloadError = err;
                    pluto.emitEvent("player::download_error", err);
                    attempts = 0;
                    return;
                }
                console.log("Requesting headers");
                request.head(url, function(err, res, body) {
                    if (err ||
                        !res.headers['content-type'] || !res.headers['content-length'] ||
                        res.headers['content-type'].indexOf("audio") == -1 || res.headers['content-length']/1000000 < MIN_MB) {
                        songs[song.id].ignore.push(url);
                        if (!err) console.log("Wrong format/not good enough:", res.headers['content-type']);
                        if (err) console.log("Got error: " + err);
                        pluto.saveStorage("songs");
                        pluto.emitEvent("music::play", song);
                    } else {
                        console.log("Starting download");
                        var songURL = "storage/songs/" + song.id + ".mp3";
                        console.log(url);
                        var downloader = progress(request(url), {
                            throttle: 200
                        });
                        var cancelDownload = function() {
                            downloader.abort();
                            rm(songURL);
                        };
                        pluto.addListener("music::stop", cancelDownload);
                        pluto.emitEvent("player::download_started", downloader);
                        downloader.on("error", function(err) {
                            songs[song.id].ignore.push(url);
                            pluto.saveStorage("songs");
                            pluto.emitEvent("music::play", song);
                            pluto.removeListener("music::stop", cancelDownload);
                        })
                        .on("progress", function(state) {
                            downloadPercent = state.percent;
                        })
                        .pipe(fs.createWriteStream(songURL)).on('close', function() {
                            if (!test("-f", songURL)) return;
                            console.log("Downloaded file");
                            pluto.removeListener("music::stop", cancelDownload);
                            downloading = null;
                            songs[song.id].url = songURL;
                            songs[song.id].from = url;
                            pluto.saveStorage("songs");
                            player.playSong(song, url);
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
        attempts = 0;
        console.log("Stopping");
        sentStop = true;
        mplayer.stdin.write("stop\n");
        mplayer.stdin.write("quit\n");
    });


    pluto.get("/music/downloading", function(req, res) {
        res.render("songs_downloading.html", {
            error: downloadError,
            attempts: attempts,
            song: downloading,
            percent: downloadPercent,
            layout: false
        });
    });

    return player;
}
