module.exports = function(pluto) {

    var data = pluto.getStorage("users")||{};
    var title = "Music Player";

    var lastPlaying = undefined;

    var musicModule = {};

    pluto.get("/music/play", function(req, response) {
        var selectedUser = {};
        var ids = Object.keys(data);
        do {
            selectedUser = data[ids[Math.floor(Math.random()*ids.length)]];
        } while (!selectedUser.artists);
        console.log(selectedUser.name + "'s choice");
        var selectedArtist = selectedUser.artists[Math.floor(Math.random()*selectedUser.artists.length)];
        pluto.request("https://api.spotify.com/v1/search?q=" + encodeURIComponent(selectedArtist) + "&type=artist", function(res) {
            if (res.status != 200) {
                response.render("music.html", {
                    title: title,
                    message: "An error occurred: response " + res.status
                });
                return;
            }
            var artist = res.body.artists.items[0];
            console.log("Selected artist " + artist.name);
            pluto.request("https://api.spotify.com/v1/artists/" + artist.id + "/albums", function(res) {
                if (res.status != 200) {
                    response.render("music.html", {
                        title: title,
                        message: "An error occurred: response " + res.status
                    });
                    return;
                }
                var albums = res.body.items;
                var selectedAlbum = albums[Math.floor(Math.random()*albums.length)];
                console.log("Selected album " + selectedAlbum.name);
                pluto.request("https://api.spotify.com/v1/albums/" + selectedAlbum.id + "/tracks", function(res) {
                    if (res.status != 200) {
                        response.render("music.html", {
                            title: title,
                            message: "An error occurred: response " + res.status
                        });
                        return;
                    }

                    var songs = res.body.items;
                    var selectedSong = songs[Math.floor(Math.random()*songs.length)];
                    console.log("Selected song " + selectedSong.name);
                    lastPlaying = {
                        name: selectedSong.name,
                        album: selectedAlbum.name,
                        artist: selectedArtist,
                        choice: selectedUser.name
                    };
                    pluto.emitEvent("music::play", lastPlaying);
                    response.render("music.html", {
                        title: title,
                        nowPlaying: selectedArtist + " - " + selectedSong.name + " (" + selectedUser.name + "'s choice)"
                    });
                });
            });
        });
    });

    pluto.get("/music", function(req, res) {
        if (lastPlaying) {
            nowPlayingStr = lastPlaying.artist + " - " + lastPlaying.name + " (" + lastPlaying.choice + "'s choice)";
            res.render("music.html", {
                title: title,
                nowPlaying: nowPlayingStr
            });
        } else {
            res.render("music.html", {
                title: title
            });
        }
    });

    return musicModule;
}
