module.exports = function(pluto) {
    var DB_FILE = "storage/songs/local.db";
    var MAX_DISTANCE = 6;

    var local = {
        lastMessage: null
    };

    var Levenshtein = require("levenshtein");
    var fs = require("fs");
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database(DB_FILE);

    db.serialize(function() {
        db.run("PRAGMA foreign_keys=ON", function(err) { if (err) throw err; });
        db.run(
            "CREATE TABLE IF NOT EXISTS artists (" +
                "id INTEGER PRIMARY KEY, " +
                "name TEXT" +
            ")",
            function(err) { if (err) throw err; }
        );
        db.run(
            "CREATE TABLE IF NOT EXISTS albums (" +
                "id INTEGER PRIMARY KEY, " +
                "name TEXT, " +
                "artist INTEGER, " +
                "art TEXT, " +
                "FOREIGN KEY(artist) REFERENCES artists(id) ON DELETE CASCADE" +
            ")",
            function(err) { if (err) throw err; }
        );
        db.run(
            "CREATE TABLE IF NOT EXISTS songs (" +
                "id INTEGER PRIMARY KEY, " +
                "name TEXT, " +
                "artist INTEGER, " +
                "album INTEGER, " +
                "track INTEGER, " +
                "FOREIGN KEY(artist) REFERENCES artists(id) ON DELETE CASCADE, " +
                "FOREIGN KEY(album) REFERENCES albums(id) ON DELETE CASCADE" +
            ")",
            function(err) { if (err) throw err; }
        );
    });

    local.setArtist = function(artist, callback) {
        if (!artist.id) {
            db.run(
                "INSERT INTO artists (name) VALUES (?)",
                artist.name,
                callback
            );
        } else {
            db.run(
                "UPDATE artists SET name = ? WHERE id = ?",
                artist.name,
                artist.id,
                callback
            );
        }
    };

    local.setAlbum = function(album, callback) {
        if (!album.id) {
            db.run(
                "INSERT INTO albums (name, artist, art) VALUES (?, ?, ?)",
                album.name,
                album.artist,
                album.art,
                callback
            );
        } else {
            db.run(
                "UPDATE albums SET name = ?, artist = ?, art = ? WHERE id = ?",
                album.name,
                album.artist,
                album.art,
                album.id,
                callback
            );
        }
    };

    local.setSong = function(song, callback) {
        if (!song.id) {
            db.run(
                "INSERT INTO songs (name, artist, album, track) VALUES (?, ?, ?, ?)",
                song.name,
                song.artist,
                song.album,
                song.track,
                callback
            );
        } else {
            db.run(
                "UPDATE songs SET name = ?, artist = ?, album = ?, track = ? WHERE id = ?",
                song.name,
                song.artist,
                song.album,
                song.track,
                song.id,
                callback
            );
        }
    };

    local.deleteArtist = function(id, callback) {
        db.run(
            "DELETE FROM artists WHERE id = ?",
            id,
            callback
        )
    };

    local.deleteAlbum = function(id, callback) {
        db.run(
            "DELETE FROM albums WHERE id = ?",
            id,
            callback
        )
    };

    local.deleteSong = function(id, callback) {
        db.run(
            "DELETE FROM songs WHERE id = ?",
            id,
            callback
        )
    };

    local.getSong = function(targetSong, targetAlbum, targetArtist, callback) {
        db.serialize(function() {
            if (targetArtist) {
                db.all("SELECT * FROM artists", function(err, rows) {
                    if (err) return callback(err, null);
                    var selectedArtist = _.min(
                        rows,
                        function(artist) {
                            return new Levenshtein(targetArtist, artist.name).distance;
                        }
                    );
                    if (new Levenshtein(targetArtist, selectedArtist.name).distance <= MAX_DISTANCE) {
                        query = db.prepare("SELECT * FROM songs, albums WHERE songs.album = albums.id AND songs.artist = ?");
                        query.all(selectedArtist.id, function(err, rows) {
                            if (err) return callback(err, null);
                            var selectedSong = _.min(
                                rows,
                                function(song) {
                                    return new Levenshtein(targetSong, song.name).distance;
                                }
                            );
                            if (new Levenshtein(targetSong, selectedSong.name).distance <= MAX_DISTANCE) {
                                selectedSong.artist = selectedArtist.name;
                                selectedSong.local = true;
                                callback(null, targetSong);
                            } else {
                                callback("No results found", null);
                            }
                        });
                    } else {
                        callback("No results found", null);
                    }
                });
            } else {
                query = db.prepare("SELECT * FROM songs, albums, artists" +
                                   "WHERE songs.album = albums.id AND songs.artist = artists.id");
                query.all(selectedArtist.id, function(err, rows) {
                    if (err) return callback(err, null);
                    var selectedSong = _.min(
                        rows,
                        function(song) {
                            return new Levenshtein(targetSong, song.name).distance;
                        }
                    );
                    if (new Levenshtein(targetSong, selectedSong.name).distance <= MAX_DISTANCE) {
                        selectedSong.local = true;
                        callback(null, targetSong);
                    } else {
                        callback("No results found", null);
                    }
                });
            }
        });
    };

    local.getAlbum = function(targetAlbum, targetArtist, callback) {
        db.serialize(function() {
            if (targetArtist) {
                db.all("SELECT * FROM artists", function(err, rows) {
                    if (err) return callback(err, null);
                    var selectedArtist = _.min(
                        rows,
                        function(artist) {
                            return new Levenshtein(targetArtist, artist.name).distance;
                        }
                    );
                    if (new Levenshtein(targetArtist, selectedArtist.name).distance <= MAX_DISTANCE) {
                        query = db.prepare("SELECT * FROM albums WHERE albums.artist = artists.id AND albums.artist = ?");
                        query.all(selectedAritst.id, function(err, rows) {
                            if (err) return callback(err, null);
                            var selectedAlbum = _.min(
                                rows,
                                function(album) {
                                    return new Levenshtein(targetAlbum, album.name).distance;
                                }
                            );
                            if (new Levenshtein(targetAlbum, selectedAlbum.name).distance <= MAX_DISTANCE) {
                                query = db.prepare("SELECT * FROM songs WHERE songs.album = ? ORDER BY songs.track");
                                query.all(selectedAlbum.id, function(err, songs) {
                                    if (err) return callback(err, null);
                                    songs.forEach(function(song) {
                                        song.artist = selectedArtist.name;
                                    });
                                    callback(null, songs);
                                });
                            } else {
                                callback("No results found", null);
                            }
                        });
                    } else {
                        callback("No results found", null);
                    }
                });
            } else {
                db.all("SELECT * FROM albums WHERE albums.artist = artists.id", function(err, rows) {
                    if (err) return callback(err, null);
                    var selectedAlbum = _.min(
                        rows,
                        function(album) {
                            return new Levenshtein(targetAlbum, album.name).distance;
                        }
                    );
                    if (new Levenshtein(targetAlbum, selectedAlbum.name).distance <= MAX_DISTANCE) {
                        query = db.prepare("SELECT * FROM songs WHERE songs.album = ? ORDER BY songs.track");
                        query.all(selectedAlbum.id, function(err, songs) {
                            if (err) return callback(err, null);
                            songs.forEach(function(song) {
                                song.artist = selectedArtist.name;
                            });
                            callback(null, songs);
                        });
                    } else {
                        callback("No results found", null);
                    }
                });
            }
        });
    };

    pluto.get("/music/local/artists", function(req, res) {
        db.all("SELECT * FROM artists ORDER BY name", function(err, artists) {
            if (err) throw err;
            res.json({artists: artists});
        });
    });

    pluto.get("/music/local/artist/:id", function(req, res) {
        var query = db.prepare("SELECT * FROM albums WHERE artist = ? ORDER BY name");
        query.all(req.params.id, function(err, albums) {
            if (err) throw err;
            res.json({artist: parseInt(req.params.id), albums: albums});
        });
    });

    pluto.get("/music/local/album/:id", function(req, res) {
        var query = db.prepare("SELECT * FROM songs WHERE album = ? ORDER BY track, name");
        query.all(req.params.id, function(err, songs) {
            if (err) throw err;
            res.json({artist: parseInt(req.params.id), albums: songs});
        });
    });

    pluto.post("/music/local/artist", function(req, res) {
        local.setArtist(req.body, function(err) {
            if (err) local.lastMessage = err;
            res.redirect("/music/local");
        });
    });

    pluto.post("/music/local/album", function(req, res) {
        local.setAlbum(req.body, function(err) {
            if (err) local.lastMessage = err;
            res.redirect("/music/local");
        });
    });

    pluto.post("/music/local/song", function(req, res) {
        local.setSong(req.body, function(err) {
            if (err) local.lastMessage = err;
            res.redirect("/music/local");
        });
    });

    pluto.post("/music/local/artist/:id/delete", function(req, res) {
        local.deleteArtist(req.params.id, function(err) {
            if (err) local.lastMessage = err;
            res.redirect("/music/local");
        });
    });

    pluto.post("/music/local/album/:id/delete", function(req, res) {
        local.deleteAlbum(req.params.id, function(err) {
            if (err) local.lastMessage = err;
            res.redirect("/music/local");
            //TODO: redirect and pass req.query.type, req.query.id
        });
    });

    pluto.post("/music/local/song/:id/delete", function(req, res) {
        local.deleteSong(req.params.id, function(err) {
            if (err) local.lastMessage = err;
            res.redirect("/music/local");
        });
    });

    pluto.get("/music/local", function(req, res) {
        var message = local.lastMessage;
        local.lastMessage = null;
        res.render("music_local.html", {
            scripts: ["/javascripts/music_local.js"],
            lastMessage: message
        });
    });

    return local;
};
