module.exports = function(pluto) {

    var data = pluto.getStorage("users")||{};
    var title = "Music Player";
    var lastMessage = undefined;

    var lastPlaying = undefined;
    var queue = [];
    var paused = false;

    var musicModule = {};

    pluto.post("/music/add", function(req, response) {
        if (req.body.song) {
            var searchTerm = (req.body.artist ? (encodeURIComponent(req.body.artist) + " ") : "") +
                (req.body.album ? (encodeURIComponent(req.body.album) + " ") : "") +
                encodeURIComponent(req.body.song);
            pluto.request("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=track", function(res) {
                if (res.status != 200) {
                    lastMessage = "An error occurred: response " + res.status;
                    response.redirect("/music");
                    return;
                }
                var song = res.body.tracks.items[0];
                queue.push({
                    name: song.name,
                    album: song.album.name,
                    artist: song.artists[0].name,
                    id: song.id,
                    art: song.album.images[1].url
                });
                response.redirect("/music");
            });
        } else if (req.body.album) {
            var searchTerm = (req.body.artist ? (encodeURIComponent(req.body.artist) + " ") : "") +
                encodeURIComponent(req.body.album);
            pluto.request("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=album", function(res) {
                if (res.status != 200) {
                    lastMessage = "An error occurred: response " + res.status;
                    response.redirect("/music");
                    return;
                }
                var album = res.body.albums.items[0];
                pluto.request("https://api.spotify.com/v1/albums/" + album.id + "/tracks", function(res) {
                    if (res.status != 200) {
                        lastMessage = "An error occurred: response " + res.status;
                        response.redirect("/music");
                        return;
                    }

                    var songs = res.body.items;
                    artist = songs[0].artists[0].name;
                    queue = queue.concat(songs.map(function(song) {
                        return {
                            name: song.name,
                            album: album.name,
                            artist: artist,
                            id: song.id,
                            art: album.images[1].url,
                        }
                    }));
                    response.redirect("/music");
                });
            });
        } else {
            lastMessage = "Add more detail!";
            response.redirect("/music");
        }
    });

    pluto.post("/music/shuffle", function(req, response) {
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
                lastMessage = "An error occurred: response " + res.status;
                response.redirect("/music");
                return;
            }
            var artist = res.body.artists.items[0];
            console.log("Selected artist " + artist.name);
            pluto.request("https://api.spotify.com/v1/artists/" + artist.id + "/albums", function(res) {
                if (res.status != 200) {
                    lastMessage = "An error occurred: response " + res.status;
                    response.redirect("/music");
                    return;
                }
                var albums = res.body.items;
                var selectedAlbum = albums[Math.floor(Math.random()*albums.length)];
                console.log("Selected album " + selectedAlbum.name);
                pluto.request("https://api.spotify.com/v1/albums/" + selectedAlbum.id + "/tracks", function(res) {
                    if (res.status != 200) {
                        lastMessage = "An error occurred: response " + res.status;
                        response.redirect("/music");
                        return;
                    }

                    var songs = res.body.items;
                    var selectedSong = songs[Math.floor(Math.random()*songs.length)];
                    console.log("Selected song " + selectedSong.name);
                    queue.push({
                        name: selectedSong.name,
                        album: selectedAlbum.name,
                        artist: selectedArtist,
                        id: selectedSong.id,
                        art: selectedAlbum.images[1].url,
                        choice: selectedUser.name
                    });
                    response.redirect("/music");
                });
            });
        });
    });

    pluto.post("/music/play", function(req, res) {
        if (paused) {
            paused = false;
            pluto.emitEvent("music::resume");
        } else if (queue.length > 0) {
            paused = false;
            lastPlaying = queue.shift();
            pluto.emitEvent("music::play", lastPlaying, queue[0]);
        } else {
            lastMessage = "Nothing in the queue to play!";
        }
        res.redirect("/music");
    });

    pluto.post("/music/pause", function(req, res) {
        if (lastPlaying) {
            paused = true;
            pluto.emitEvent("music::pause");
        }
        res.redirect("/music");
    });

    pluto.post("/music/next", function(req, res) {
        pluto.emitEvent("music::next");
        res.redirect("/music");
    });

    pluto.post("/music/queue/delete/:index", function(req, res) {
        queue.splice(parseInt(req.params.index)-1, 1);
        res.redirect("/music");
    });

    pluto.post("/music/queue/move/:index/up", function(req, res) {
        index = parseInt(req.params.index);
        elements = queue.splice(index-1, 1);
        queue.splice(index-2, 0, elements[0])
        res.redirect("/music#song_" + (index-1));
    });

    pluto.post("/music/queue/move/:index/down", function(req, res) {
        index = parseInt(req.params.index);
        elements = queue.splice(index-1, 1);
        queue.splice(index, 0, elements[0])
        res.redirect("/music#song_" + (index+1));
    });

    pluto.addListener("music::next", function() {
        paused = false;
        lastPlaying = queue.shift();
        if (lastPlaying) {
            pluto.emitEvent("music::stop");
            pluto.emitEvent("music::play", lastPlaying, queue[0]);
        }
    });

    pluto.get("/music", function(req, res) {
        queue.forEach(function(element, index) {
            element.first = (index == 0);
            element.last = (index == queue.length-1);
            element.index = index+1;
        });
        res.render("music.html", {
            message: lastMessage,
            title: title,
            nowPlaying: lastPlaying,
            queue: queue,
            canSkip: queue.length > 0 && lastPlaying,
            canPlay: paused || (!lastPlaying && queue.length > 0),
            canPause: lastPlaying && !paused
        });
        lastMessage = undefined;
    });

    return musicModule;
}
