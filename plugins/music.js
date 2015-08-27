module.exports = function(pluto) {

    var data = pluto.getStorage("users")||{};
    var title = "Music Player";
    var scripts = ["/javascripts/music_frontend.js"];

    var musicModule = {
        lastPlaying: null,
        progress: null,
        queue: [],
        paused: false,
        lastMessage: null
    };

    pluto.addListener("player::progress", function(data) {
        musicModule.progress = data;
    });
    pluto.get("/music/progress", function(req, res) {
        if (musicModule.lastPlaying) {
            res.json({
                total: musicModule.progress.total,
                current: musicModule.progress.current,
                playing: !musicModule.paused
            });
        } else {
            res.json({});
        }
    });

    pluto.post("/music/add", function(req, response) {
        if (req.body.song) {
            var searchTerm = (req.body.artist ? (encodeURIComponent(req.body.artist) + " ") : "") +
                (req.body.album ? (encodeURIComponent(req.body.album) + " ") : "") +
                encodeURIComponent(req.body.song);
            pluto.request("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=track", function(res) {
                if (res.status != 200) {
                    musicModule.lastMessage = "An error occurred: response " + res.status;
                    response.redirect("/music");
                    return;
                }
                if (!res.body.tracks || !res.body.tracks.items || res.body.tracks.items.length == 0) {
                    musicModule.lastMessage = "Sorry, no results were found.";
                    response.redirect("/music");
                    return;
                }
                var song = res.body.tracks.items[0];
                var element = {
                    name: song.name,
                    album: song.album.name,
                    artist: song.artists[0].name,
                    id: song.id,
                    art: song.album.images && song.album.images[1] ? song.album.images[1].url : ""
                };
                if (req.body.position == "next") {
                    musicModule.queue.unshift(element);
                } else {
                    musicModule.queue.push(element);
                }
                response.redirect("/music");
            });
        } else if (req.body.album) {
            var searchTerm = (req.body.artist ? (encodeURIComponent(req.body.artist) + " ") : "") +
                encodeURIComponent(req.body.album);
            pluto.request("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=album", function(res) {
                if (res.status != 200) {
                    musicModule.lastMessage = "An error occurred: response " + res.status;
                    response.redirect("/music");
                    return;
                }
                if (!res.body.albums || !res.body.albums.items || res.body.albums.items.length == 0) {
                    musicModule.lastMessage = "Sorry, no results were found.";
                    response.redirect("/music");
                    return;
                }
                var album = res.body.albums.items[0];
                var albumArt = album.images && album.images[1] ? album.images[1].url : "";
                pluto.request("https://api.spotify.com/v1/albums/" + album.id + "/tracks", function(res) {
                    if (res.status != 200) {
                        musicModule.lastMessage = "An error occurred: response " + res.status;
                        response.redirect("/music");
                        return;
                    }
                    if (!res.body.items || res.body.items.length == 0) {
                        musicModule.lastMessage = "Sorry, no results were found.";
                        response.redirect("/music");
                        return;
                    }

                    var songs = res.body.items;
                    artist = songs[0].artists[0].name;
                    newTracks = songs.map(function(song) {
                        return {
                            name: song.name,
                            album: album.name,
                            artist: artist,
                            id: song.id,
                            art: albumArt,
                        }
                    });
                    if (req.body.position == "next") {
                        musicModule.queue = newTracks.concat(musicModule.queue);
                    } else {
                        musicModule.queue = musicModule.queue.concat(newTracks);
                    }
                    response.redirect("/music");
                });
            });
        } else {
            musicModule.lastMessage = "Add more detail!";
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
        pluto.request("https://api.spotify.com/v1/search?q=" +
            encodeURIComponent(selectedArtist) + "&type=artist",
            function(res)
        {
            if (res.status != 200) {
                musicModule.lastMessage = "An error occurred: response " + res.status;
                response.redirect("/music");
                return;
            }
            if (!res.body.artists || !res.body.artists.items || res.body.artists.items.length == 0) {
                musicModule.lastMessage = "Sorry, no results were found.";
                response.redirect("/music");
                return;
            }
            var artist = res.body.artists.items[0];
            console.log("Selected artist " + artist.name);
            pluto.request("https://api.spotify.com/v1/artists/" + artist.id + "/albums", function(res) {
                if (res.status != 200) {
                    musicModule.lastMessage = "An error occurred: response " + res.status;
                    response.redirect("/music");
                    return;
                }
                if (!res.body.items || res.body.items.length == 0) {
                    musicModule.lastMessage = "Sorry, no results were found.";
                    response.redirect("/music");
                    return;
                }
                var albums = res.body.items;
                var selectedAlbum = albums[Math.floor(Math.random()*albums.length)];
                var albumArt = selectedAlbum.images && selectedAlbum.images[1] ? selectedAlbum.images[1].url : "";
                console.log("Selected album " + selectedAlbum.name);
                pluto.request("https://api.spotify.com/v1/albums/" + selectedAlbum.id + "/tracks", function(res) {
                    if (res.status != 200) {
                        musicModule.lastMessage = "An error occurred: response " + res.status;
                        response.redirect("/music");
                        return;
                    }
                    if (!res.body.items || res.body.items.length == 0) {
                        musicModule.lastMessage = "Sorry, no results were found.";
                        response.redirect("/music");
                        return;
                    }

                    var songs = res.body.items;
                    var selectedSong = songs[Math.floor(Math.random()*songs.length)];
                    console.log("Selected song " + selectedSong.name);
                    var nextTrack = {
                        name: selectedSong.name,
                        album: selectedAlbum.name,
                        artist: selectedArtist,
                        id: selectedSong.id,
                        art: albumArt,
                        choice: selectedUser.name
                    };
                    if (req.params.position == "next") {
                        musicModule.queue.unshift(nextTrack);
                    } else {
                        musicModule.queue.push(nextTrack);
                    }
                    musicModule.queue.push();
                    response.redirect("/music");
                });
            });
        });
    });

    pluto.post("/music/play", function(req, res) {
        if (musicModule.paused) {
            musicModule.paused = false;
            pluto.emitEvent("music::resume");
        } else if (musicModule.queue.length > 0) {
            musicModule.paused = false;
            musicModule.lastPlaying = musicModule.queue.shift();
            pluto.emitEvent("music::play", musicModule.lastPlaying, musicModule.queue[0]);
        } else {
            musicModule.lastMessage = "Nothing in the musicModule.queue to play!";
        }
        res.redirect("/music");
    });

    pluto.post("/music/pause", function(req, res) {
        if (musicModule.lastPlaying) {
            musicModule.paused = true;
            pluto.emitEvent("music::pause");
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
        musicModule.lastPlaying = musicModule.queue.shift();
        if (musicModule.lastPlaying) {
            pluto.emitEvent("music::stop");
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
