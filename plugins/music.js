module.exports = function(pluto) {
    var async = require("async");
    // include module to get spotify playlist information
    var spotifyData = require("./spotify-data.js");

    var data = pluto.getStorage("users");
    var title = "Music Player";
    var scripts = ["/javascripts/music_frontend.js"];

    var sources = [];
    //Sources are expected to implement the following functions:
    //source.getSong(targetSong, targetAlbum, targetArtist, callback(err, result))
    //source.getAlbum(targetAlbum, targetArtist, callback(err, result))

    var musicModule = {
        lastPlaying: null,
        progress: null,
        queue: [],
        paused: false,
        lastMessage: null,
        downloading: false,
        sources: [],
        trySources: function(test, after) {
            var queue = musicModule.sources.slice(); //get copy of array
            var err = null;
            var result = null;
            async.whilst(
                function() {
                    // Run until we get a result or run out of sources
                    return !result && queue.length > 0;
                },
                function(callback) {
                    test(queue.shift(), function(e, r) {
                        err = e;
                        result = r;
                        console.log(e, r);
                        callback();
                    });
                },
                function() {
                    after(err, result);
                }
            );
        }
    };

    if (pluto.modules.spotify) musicModule.sources.push(pluto.modules.spotify);

    pluto.addListener("player::progress", function(data) {
        musicModule.progress = data;
        musicModule.downloading = false;
    });
    pluto.get("/music/progress/:id", function(req, res) {
        if (musicModule.lastPlaying && musicModule.progress) {
            if (musicModule.lastPlaying.id != req.params.id) {
                res.send('{"reload": true}');
            } else {
                res.json({
                    total: musicModule.progress.total,
                    current: musicModule.progress.current,
                    playing: !musicModule.paused
                });
            }
        } else if (!musicModule.downloading && req.params.id != "none") {
          res.send('{"reload": true}');
        } else {
            res.json({});
        }
    });

    pluto.post("/music/add", function(req, response) {
        if (req.body.song) {
            musicModule.trySources(
                function(source, callback) {
                    source.getSong(
                        req.body.song,
                        req.body.album,
                        req.body.artist,
                        callback
                    );
                },
                function(err, result) {
                    if (err) {
                        musicModule.lastMessage = err;
                    } else if (!result) {
                        musicModule.lastMessage = "No results given";
                    } else if (req.body.position == "next") {
                        musicModule.queue.unshift(result);
                    } else {
                        musicModule.queue.push(result);
                    }
                    response.redirect("/music");
                }
            );
        } else if (req.body.album) {
            musicModule.trySources(
                function(source, callback) {
                    source.getAlbum(
                        req.body.album,
                        req.body.artist,
                        callback
                    );
                },
                function(err, album) {
                    if (err) {
                        musicModule.lastMessage = err;
                    } else if (!album) {
                        musicModule.lastMessage = "No results given";
                    } else if (req.body.position == "next") {
                        musicModule.queue = album.concat(musicModule.queue);
                    } else {
                        musicModule.queue = musicModule.queue.concat(album);
                    }
                    response.redirect("/music");
                }
            );
        } else {
            musicModule.lastMessage = "Add more detail!";
            response.redirect("/music");
        }
    });

// Adding functionality to add a Spotify playlist

    pluto.post("/music/addPlaylist", function(req, response) {
        // Verify that user_id and playlist_id are set before searching
        if (req.body.user_id && req.body.playlist_id) {
            // Call method to obtain playlist information
            spotifyData.playlist(req.body.user_id, req.body.playlist_id, function(err, playlist) {
                //console.log(playlist);
                if (err) {
                    musicModule.lastMessage = err;
                    response.redirect("/music");
                } else if (!playlist) {
                    musicModule.lastMessage = "No songs in playlist";
                    response.redirect("/music");
                } else {
                    var songs = [];
                    async.whilst(
                        function () {
                            console.log(playlist.playlist.tracks.length)
                            return playlist.playlist.tracks.length > 0;
                        },
                        function (callback) {
                            var track = playlist.playlist.tracks.shift();
                            //console.log(track.href.substr(13));
                            // While playlist has songs left, obtain song object and push it onto songs array
                            pluto.modules.spotify.getSongFromID(track.href.substr(14), function(err, result) {
                                //console.log(result);
                                if (err) {
                                    callback(err);
                                } else if (!result) {
                                    callback(new Error ("No results given for " + track.name));
                                } else if (req.body.position == "next") {
                                    songs.push(result);
                                    callback(null);
                                }
                            });

                        },
                        // Error handler + push songs array onto queue
                        function (err) {
                            if (err) { musicModule.lastMessage = err;}
                            else {
                                if (req.body.position == "next") {
                                    // Append playlist immediately after
                                    musicModule.queue = songs.concat(musicModule.queue);
                                } else {
                                    // Append playlist to the end
                                    musicModule.queue = musicModule.queue.concat(songs);
                                }
                            }
                            response.redirect("/music");
                        }
                    );
                }
            });
        } else {
            musicModule.lastMessage = "Please include user ID as well as playlist ID!";
            response.redirect("/music");
        }
    });

    pluto.post("/music/shuffle/:position", function(req, response) {
        var selectedUser = {};
        var ids = Object.keys(data);
        do {
            selectedUser = data[ids[Math.floor(Math.random()*ids.length)]];
        } while (!selectedUser.artists);
        console.log(selectedUser.name + "'s choice");
        var selectedArtist = selectedUser.artists[Math.floor(Math.random()*selectedUser.artists.length)];
        pluto.modules.spotify.randomFromArtist(selectedArtist, function(err, nextTrack) {
            if (err) {
                musicModule.lastMessage = err;
            } else if (!nextTrack) {
                musicModule.lastMessage = "No results given";
            } else if (req.params.position == "next") {
                musicModule.queue.unshift(nextTrack);
            } else {
                musicModule.queue.push(nextTrack);
            }
            response.redirect("/music");
        });
    });

    pluto.addListener("player::download_error", function(err) {
        musicModule.downloading = false;
        musicModule.progress = null;
    });

    pluto.post("/music/play", function(req, res) {
        if (musicModule.downloading) {
            console.log("Can't play, music is downloading!");
            // Do nothing when waiting for download
        } else if (musicModule.paused) {
            musicModule.paused = false;
            pluto.emitEvent("music::resume");
        } else if (musicModule.queue.length > 0) {
            musicModule.progress = null;
            musicModule.downloading = true;
            musicModule.paused = false;
            musicModule.lastPlaying = musicModule.queue.shift();
            pluto.emitEvent("music::play", musicModule.lastPlaying, musicModule.queue[0]);
        } else {
            musicModule.lastMessage = "Nothing in the queue to play!";
        }
        res.redirect("/music");
    });

    pluto.post("/music/pause", function(req, res) {
        if (musicModule.downloading) {
            console.log("Can't pause, music is downloading!");
            // Do nothing when waiting for download
        } else if (musicModule.lastPlaying) {
            musicModule.paused = true;
            pluto.emitEvent("music::pause");
        }
        res.redirect("/music");
    });

    pluto.post("/music/retry", function(req, res) {
        if (musicModule.lastPlaying) {
            musicModule.paused = false;
            musicModule.downloading = true;
            musicModule.progress = null;
            pluto.emitEvent("music::stop");
            pluto.emitEvent("music::retry", musicModule.lastPlaying);
        }
        res.redirect("/music");
    });

    pluto.post("/music/reset", function(req, res) {
        if (musicModule.lastPlaying) {
            musicModule.paused = false;
            musicModule.downloading = true;
            musicModule.progress = null;
            pluto.emitEvent("music::stop");
            pluto.emitEvent("music::reset", musicModule.lastPlaying);
        }
        res.redirect("/music");
    });

    pluto.post("/music/next", function(req, res) {
        pluto.emitEvent("music::next");
        res.redirect("/music");
    });

    pluto.post("/music/queue/delete/:index", function(req, res) {
        var index = parseInt(req.params.index);
        if (index-1 < 0 || index > musicModule.queue.length) {
            res.redirect("/music");
            return;
        }
        musicModule.queue.splice(index-1, 1);
        res.redirect("/music#song_" + index);
    });

    pluto.post("/music/queue/move/:index/up", function(req, res) {
        index = parseInt(req.params.index);
        if (index-1 < 0 || index > musicModule.queue.length) {
            res.redirect("/music");
            return;
        }
        elements = musicModule.queue.splice(index-1, 1);
        musicModule.queue.splice(index-2, 0, elements[0])
        res.redirect("/music#song_" + (index-1));
    });

    pluto.post("/music/queue/move/:index/down", function(req, res) {
        index = parseInt(req.params.index);
        if (index-1 < 0 || index > musicModule.queue.length) {
            res.redirect("/music");
            return;
        }
        elements = musicModule.queue.splice(index-1, 1);
        musicModule.queue.splice(index, 0, elements[0])
        res.redirect("/music#song_" + (index+1));
    });

    pluto.addListener("music::next", function() {
        musicModule.paused = false;
        musicModule.downloading = false;
        musicModule.progress = null;
        musicModule.lastPlaying = musicModule.queue.shift();
        pluto.emitEvent("music::stop");
        if (musicModule.lastPlaying) {
            musicModule.downloading = true;
            pluto.emitEvent("music::play", musicModule.lastPlaying, musicModule.queue[0]);
        }
    });

    pluto.get("/music", function(req, res) {
        musicModule.queue.forEach(function(element, index) {
            element.index = index+1;
        });
        res.render("music.html", {
            message: musicModule.lastMessage,
            title: title,
            nowPlaying: musicModule.lastPlaying,
            queue: musicModule.queue,
            canSkip: musicModule.queue.length > 0 && musicModule.lastPlaying,
            canPlay: musicModule.paused || (!musicModule.lastPlaying && musicModule.queue.length > 0),
            canPause: musicModule.lastPlaying && !musicModule.paused,
            scripts: scripts
        });
        musicModule.lastMessage = undefined;
    });

    return musicModule;
}
