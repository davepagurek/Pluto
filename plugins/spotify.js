module.exports = function(pluto) {
    var spotify = {};

    spotify.getSong = function(targetSong, targetAlbum, targetArtist, callback) {
        var searchTerm = (targetArtist ? (encodeURIComponent(targetArtist) + " ") : "") +
            (targetAlbum ? (encodeURIComponent(targetAlbum) + " ") : "") +
            encodeURIComponent(targetSong);
        pluto.request("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=track", function(res) {
            if (res.status != 200) {
                return callback("An error occurred: response " + res.status, null);
            }
            if (!res.body.tracks || !res.body.tracks.items || res.body.tracks.items.length == 0) {
                return callback("Sorry, no results were found.", null);
            }
            var song = res.body.tracks.items[0];
            callback(null, {
                name: song.name,
                album: song.album.name,
                artist: song.artists[0].name,
                id: song.id,
                art: song.album.images && song.album.images[1] ? song.album.images[1].url : ""
            });
        });
    };

    spotify.getAlbum = function(targetAlbum, targetArtist, callback) {
        var searchTerm = (targetArtist ? (encodeURIComponent(targetArtist) + " ") : "") +
            encodeURIComponent(targetAlbum);
        pluto.request("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=album", function(res) {
            if (res.status != 200) {
                return callback("An error occurred: response " + res.status, null);
            }
            if (!res.body.albums || !res.body.albums.items || res.body.albums.items.length == 0) {
                return callback("Sorry, no results were found.", null);
            }
            var album = res.body.albums.items[0];
            var albumArt = album.images && album.images[1] ? album.images[1].url : "";
            pluto.request("https://api.spotify.com/v1/albums/" + album.id + "/tracks", function(res) {
                if (res.status != 200) {
                    return callback("An error occurred: response " + res.status, null);
                }
                if (!res.body.items || res.body.items.length == 0) {
                    return callback("Sorry, no results were found.", null);
                }

                var songs = res.body.items;
                artist = songs[0].artists[0].name;
                callback(null, songs.map(function(song) {
                    return {
                        name: song.name,
                        album: album.name,
                        artist: artist,
                        id: song.id,
                        art: albumArt,
                    }
                }));
            });
        });
    };

    spotify.randomFromArtist = function(artist, callback) {
        pluto.request("https://api.spotify.com/v1/search?q=" +
            encodeURIComponent(artist) + "&type=artist",
            function(res)
        {
            if (res.status != 200) {
                return callback("An error occurred: response " + res.status, null);
            }
            if (!res.body.artists || !res.body.artists.items || res.body.artists.items.length == 0) {
                return callback("Sorry, no results were found.", null);
            }
            var artist = res.body.artists.items[0];
            console.log("Selected artist " + artist.name);
            pluto.request("https://api.spotify.com/v1/artists/" + artist.id + "/albums", function(res) {
                if (res.status != 200) {
                    return callback("An error occurred: response " + res.status, null);
                }
                if (!res.body.items || res.body.items.length == 0) {
                    return callback("Sorry, no results were found.", null);
                }
                var albums = res.body.items;
                var selectedAlbum = albums[Math.floor(Math.random()*albums.length)];
                var albumArt = selectedAlbum.images && selectedAlbum.images[1] ? selectedAlbum.images[1].url : "";
                console.log("Selected album " + selectedAlbum.name);
                pluto.request("https://api.spotify.com/v1/albums/" + selectedAlbum.id + "/tracks", function(res) {
                    if (res.status != 200) {
                        return callback("An error occurred: response " + res.status, null);
                    }
                    if (!res.body.items || res.body.items.length == 0) {
                        return callback("Sorry, no results were found.", null);
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
    };

    return spotify;
};
