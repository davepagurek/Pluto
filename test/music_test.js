var assert = require("assert");
var request = require('supertest');

describe("music", function(){
    it("should retrieve song data from Spotify", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://api.spotify.com/v1/search?q=Slim%20Shady&type=track": {
                    body: slimShadyTrackSearch,
                    status: 200
                }
            },
        });
        var musicModule = require("../plugins/music.js")(pluto);
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/add")
        .field("song", "Slim Shady")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 1, "Song should be added to queue");
            assert.equal(musicModule.queue[0].name, "The Real Slim Shady");
            assert.equal(musicModule.queue[0].artist, "Eminem");
            assert.equal(musicModule.queue[0].album, "Curtain Call (Deluxe Explicit)");
            assert.equal(musicModule.queue[0].id, "1MYlx4dBtiyjn7K8YSyfzT");
            assert.equal(musicModule.queue[0].art, "https://i.scdn.co/image/857f26ed0e8202e1d4054bead2a2eafb5b7f3eff");
            done();
        });
    });
    it("should send a message if it can't connect to Spotify", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://api.spotify.com/v1/search?q=Slim%20Shady&type=track": {
                    status: 500
                }
            },
        });
        var musicModule = require("../plugins/music.js")(pluto);
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/add")
        .field("song", "Slim Shady")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 0, "Nothing should be added to queue");
            assert(musicModule.lastMessage, "Message is no longer null");
            done();
        });
    });
    it("should retrieve album data from Spotify", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://api.spotify.com/v1/search?q=Slim%20Shady&type=album": {
                    body: slimShadyAlbumSearch,
                    status: 200
                },
                "https://api.spotify.com/v1/albums/0JnN0ZgNrYxz3Gk725HiAd/tracks": {
                    body: slimShadyAlbumTracks,
                    status: 200
                }
            },
        });
        var musicModule = require("../plugins/music.js")(pluto);
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/add")
        .field("album", "Slim Shady")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Tracks should be added to queue");
            assert.equal(musicModule.queue[0].name, "Public Service Announcement");
            assert.equal(musicModule.queue[1].name, "My Name Is");
            assert.equal(musicModule.queue[0].artist, "Eminem");
            assert.equal(musicModule.queue[0].album, "The Slim Shady LP (Explicit)");
            assert.equal(musicModule.queue[0].art, "https://i.scdn.co/image/86c91c6d4df8e9e2a6e61e658a8cf72f45153501");
            done();
        });
    });
    it("should send a message if there are no results", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://api.spotify.com/v1/search?q=U2 Go%20Home&type=album": {
                    body: u2GoHome,
                    status: 200
                },
            },
        });
        var musicModule = require("../plugins/music.js")(pluto);
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/add")
        .field("artist", "U2")
        .field("album", "Go Home")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 0, "Nothing should be added to queue");
            assert(musicModule.lastMessage, "Message is no longer null");
            done();
        });
    });
    it("should add tracks to the end of the queue when requested", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://api.spotify.com/v1/search?q=Slim%20Shady&type=track": {
                    body: slimShadyTrackSearch,
                    status: 200
                }
            },
        });
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/add")
        .field("song", "Slim Shady")
        .field("position", "end")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Song should be added to queue");
            assert.equal(musicModule.queue[0].name, "test", "The first song is left alone");
            assert.equal(musicModule.queue[1].name, "The Real Slim Shady", "The new song is added to the end");
            done();
        });
    });
    it("should add tracks to the beginning of the queue when requested", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://api.spotify.com/v1/search?q=Slim%20Shady&type=track": {
                    body: slimShadyTrackSearch,
                    status: 200
                }
            },
        });
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/add")
        .field("song", "Slim Shady")
        .field("position", "next")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Song should be added to queue");
            assert.equal(musicModule.queue[0].name, "The Real Slim Shady", "The new song is added to the beginning");
            assert.equal(musicModule.queue[1].name, "test", "The first song is bumped down to the second track");
            done();
        });
    });
    it("should be able to move tracks up", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/move/2/up")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Queue length should be the same");
            assert.equal(musicModule.queue[0].name, "test2", "Second song should now be first");
            assert.equal(musicModule.queue[1].name, "test1", "First song should now be second");
            done();
        });
    });
    it("should not move the first track up", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/move/1/up")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Queue length should be the same");
            assert.equal(musicModule.queue[0].name, "test1", "First song is still first");
            assert.equal(musicModule.queue[1].name, "test2", "Second song is still second");
            done();
        });
    });
    it("should be able to move tracks down", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/move/1/down")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Queue length should be the same");
            assert.equal(musicModule.queue[0].name, "test2", "Second song should now be first");
            assert.equal(musicModule.queue[1].name, "test1", "First song should now be second");
            done();
        });
    });
    it("should not move the last track down", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/move/2/down")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Queue length should be the same");
            assert.equal(musicModule.queue[0].name, "test1", "First song is still first");
            assert.equal(musicModule.queue[1].name, "test2", "Second song is still second");
            done();
        });
    });
    it("should not error on moving invalid indices", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/move/3/down")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Queue length should be the same");
            assert.equal(musicModule.queue[0].name, "test1", "First song is still first");
            assert.equal(musicModule.queue[1].name, "test2", "Second song is still second");
            done();
        });
    });
    it("should be able to delete tracks", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/delete/1")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 1, "Queue length should be one less than before");
            assert.equal(musicModule.queue[0].name, "test2", "Only the second song should be left");
            done();
        });
    });
    it("should not error when deleting invalid indices", function(done) {
        var pluto = require("../Pluto/pluto.js")();
        var musicModule = require("../plugins/music.js")(pluto);
        musicModule.queue = [{name: "test1"}, {name: "test2"}];
        pluto.addModule(musicModule);
        pluto.listen();

        request(pluto.app)
        .post("/music/queue/delete/3")
        .expect(302)
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(musicModule.queue.length, 2, "Queue length should be the same");
            assert.equal(musicModule.queue[0].name, "test1", "First song is still first");
            assert.equal(musicModule.queue[1].name, "test2", "Second song is still second");
            done();
        });
    });
});

var slimShadyTrackSearch = {
  "tracks" : {
    "href" : "https://api.spotify.com/v1/search?query=Slim+Shady&offset=0&limit=1&type=track",
    "items" : [ {
      "album" : {
        "album_type" : "album",
        "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "UY" ],
        "external_urls" : {
          "spotify" : "https://open.spotify.com/album/71xFWYFtiHC8eP99QB30AA"
        },
        "href" : "https://api.spotify.com/v1/albums/71xFWYFtiHC8eP99QB30AA",
        "id" : "71xFWYFtiHC8eP99QB30AA",
        "images" : [ {
          "height" : 640,
          "url" : "https://i.scdn.co/image/431f5d17450726d5f75435e272ee74834dbbed44",
          "width" : 640
        }, {
          "height" : 300,
          "url" : "https://i.scdn.co/image/857f26ed0e8202e1d4054bead2a2eafb5b7f3eff",
          "width" : 300
        }, {
          "height" : 64,
          "url" : "https://i.scdn.co/image/15ae8eba281b051640d6c8317c448e25f4766f98",
          "width" : 64
        } ],
        "name" : "Curtain Call (Deluxe Explicit)",
        "type" : "album",
        "uri" : "spotify:album:71xFWYFtiHC8eP99QB30AA"
      },
      "artists" : [ {
        "external_urls" : {
          "spotify" : "https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR"
        },
        "href" : "https://api.spotify.com/v1/artists/7dGJo4pcD2V6oG8kP0tJRR",
        "id" : "7dGJo4pcD2V6oG8kP0tJRR",
        "name" : "Eminem",
        "type" : "artist",
        "uri" : "spotify:artist:7dGJo4pcD2V6oG8kP0tJRR"
      } ],
      "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "UY" ],
      "disc_number" : 1,
      "duration_ms" : 284800,
      "explicit" : true,
      "external_ids" : {
        "isrc" : "USIR10000448"
      },
      "external_urls" : {
        "spotify" : "https://open.spotify.com/track/1MYlx4dBtiyjn7K8YSyfzT"
      },
      "href" : "https://api.spotify.com/v1/tracks/1MYlx4dBtiyjn7K8YSyfzT",
      "id" : "1MYlx4dBtiyjn7K8YSyfzT",
      "name" : "The Real Slim Shady",
      "popularity" : 74,
      "preview_url" : "https://p.scdn.co/mp3-preview/8fcef7649f58a3ab1f1dff0f0164ddb7540af4e2",
      "track_number" : 11,
      "type" : "track",
      "uri" : "spotify:track:1MYlx4dBtiyjn7K8YSyfzT"
    } ],
    "limit" : 1,
    "next" : "https://api.spotify.com/v1/search?query=Slim+Shady&offset=1&limit=1&type=track",
    "offset" : 0,
    "previous" : null,
    "total" : 430
  }
}

var slimShadyAlbumSearch = {
  "albums" : {
    "href" : "https://api.spotify.com/v1/search?query=Slim+Shady&offset=0&limit=1&type=album",
    "items" : [ {
      "album_type" : "album",
      "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "UY" ],
      "external_urls" : {
        "spotify" : "https://open.spotify.com/album/0JnN0ZgNrYxz3Gk725HiAd"
      },
      "href" : "https://api.spotify.com/v1/albums/0JnN0ZgNrYxz3Gk725HiAd",
      "id" : "0JnN0ZgNrYxz3Gk725HiAd",
      "images" : [ {
        "height" : 629,
        "url" : "https://i.scdn.co/image/be56b27125c02ccbffec64f64752ad83faa414b0",
        "width" : 640
      }, {
        "height" : 295,
        "url" : "https://i.scdn.co/image/86c91c6d4df8e9e2a6e61e658a8cf72f45153501",
        "width" : 300
      }, {
        "height" : 63,
        "url" : "https://i.scdn.co/image/120516dd1204f96ec1f15859410e2fc7049ad6bc",
        "width" : 64
      } ],
      "name" : "The Slim Shady LP (Explicit)",
      "type" : "album",
      "uri" : "spotify:album:0JnN0ZgNrYxz3Gk725HiAd"
    } ],
    "limit" : 1,
    "next" : "https://api.spotify.com/v1/search?query=Slim+Shady&offset=1&limit=1&type=album",
    "offset" : 0,
    "previous" : null,
    "total" : 18
  }
}

var slimShadyAlbumTracks = {
  "href" : "https://api.spotify.com/v1/albums/0JnN0ZgNrYxz3Gk725HiAd/tracks?offset=0&limit=2",
  "items" : [ {
    "artists" : [ {
      "external_urls" : {
        "spotify" : "https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR"
      },
      "href" : "https://api.spotify.com/v1/artists/7dGJo4pcD2V6oG8kP0tJRR",
      "id" : "7dGJo4pcD2V6oG8kP0tJRR",
      "name" : "Eminem",
      "type" : "artist",
      "uri" : "spotify:artist:7dGJo4pcD2V6oG8kP0tJRR"
    } ],
    "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "UY" ],
    "disc_number" : 1,
    "duration_ms" : 33204,
    "explicit" : true,
    "external_urls" : {
      "spotify" : "https://open.spotify.com/track/5yHbIJxzTF9UVRcJIpT1j2"
    },
    "href" : "https://api.spotify.com/v1/tracks/5yHbIJxzTF9UVRcJIpT1j2",
    "id" : "5yHbIJxzTF9UVRcJIpT1j2",
    "name" : "Public Service Announcement",
    "preview_url" : "https://p.scdn.co/mp3-preview/fd04e442a67cafb7bcf18c0c07f91061d66b2da4",
    "track_number" : 1,
    "type" : "track",
    "uri" : "spotify:track:5yHbIJxzTF9UVRcJIpT1j2"
  }, {
    "artists" : [ {
      "external_urls" : {
        "spotify" : "https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR"
      },
      "href" : "https://api.spotify.com/v1/artists/7dGJo4pcD2V6oG8kP0tJRR",
      "id" : "7dGJo4pcD2V6oG8kP0tJRR",
      "name" : "Eminem",
      "type" : "artist",
      "uri" : "spotify:artist:7dGJo4pcD2V6oG8kP0tJRR"
    } ],
    "available_markets" : [ "AD", "AR", "AT", "AU", "BE", "BG", "BO", "BR", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "EC", "EE", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MT", "MY", "NI", "NL", "NO", "NZ", "PA", "PE", "PH", "PL", "PT", "PY", "RO", "SE", "SG", "SI", "SK", "SV", "TR", "TW", "UY" ],
    "disc_number" : 1,
    "duration_ms" : 268400,
    "explicit" : true,
    "external_urls" : {
      "spotify" : "https://open.spotify.com/track/2NBtFVoUJBc1SU4IM9Ipj7"
    },
    "href" : "https://api.spotify.com/v1/tracks/2NBtFVoUJBc1SU4IM9Ipj7",
    "id" : "2NBtFVoUJBc1SU4IM9Ipj7",
    "name" : "My Name Is",
    "preview_url" : "https://p.scdn.co/mp3-preview/03ec33b1bc39ab1e87f439e8722cfc52c3001de0",
    "track_number" : 2,
    "type" : "track",
    "uri" : "spotify:track:2NBtFVoUJBc1SU4IM9Ipj7"
  } ],
  "limit" : 2,
  "next" : "https://api.spotify.com/v1/albums/0JnN0ZgNrYxz3Gk725HiAd/tracks?offset=2&limit=2",
  "offset" : 0,
  "previous" : null,
  "total" : 20
}

var u2GoHome = {
  "albums" : {
    "href" : "https://api.spotify.com/v1/search?query=U2+Go+Home&offset=0&limit=1&type=album",
    "items" : [ ],
    "limit" : 1,
    "next" : null,
    "offset" : 0,
    "previous" : null,
    "total" : 0
  }
}
