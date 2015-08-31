var assert = require("assert");
var nock = require("nock");

describe("player", function(){
    var real_rm = null;
    var removedList = [];

    before(function() {
        real_rm = global.rm;
        global.rm = function(uri){
            removedList.push(uri);
        };
    });
    beforeEach(function() {
        removedList = [];
    });
    after(function() {
        global.rm = real_rm;
    });
    afterEach(function() {
        var testSong = "storage/songs/test.mp3";
        if (test("-f", testSong)) {
            real_rm(testSong);
        }
    });


    it("should have mplayer installed", function() {
        assert.ok(which("mplayer"));
    });

    it("should be able to play real songs", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {
                    test: {
                        ignore: [],
                        url: "test/data/test.mp3"
                    }
                }
            }
        });
        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        pluto.addListener("music::next", function() {
            try {
                assert.equal(Math.floor(songs["test"].lastPlayed/100000), Math.floor(Date.now()/100000));
                assert.equal(removedList.length, 0);
                done();
            } catch (err) {
                done(err);
            }
        });
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            done(new Error("Couldn't play file"));
        });
        pluto.emitEvent("music::play", {id:"test"});
    });
    it("should try to grab another song if it can't play something", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {
                    test: {
                        ignore: [],
                        url: "test/data/test-broken.html"
                    }
                }
            }
        });
        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        pluto.addListener("music::next", function() {
            done(new Error("It thought it played it successfully"));
        });
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            try {
                assert.equal(removedList.length, 1);
                done();
            } catch (err) {
                done(err);
            }
        });
        pluto.emitEvent("music::play", {id:"test"});
    });
    it("should try to grab another song if there is no existing link", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {}
            }
        });
        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        pluto.addListener("music::next", function() {
            done(new Error("It thought it played it successfully"));
        });
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            try {
                assert.equal(removedList.length, 0);
                done();
            } catch (err) {
                done(err);
            }
        });
        pluto.emitEvent("music::play", {id:"test"});
    });
    it("should try to grab another song if the existing link is bad", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {
                    test: {
                        ignore: [],
                        url: "not/a/real/path.mp3"
                    }
                }
            }
        });
        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        pluto.addListener("music::next", function() {
            done(new Error("It thought it played it successfully"));
        });
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            try {
                assert.equal(removedList.length, 0);
                done();
            } catch (err) {
                done(err);
            }
        });
        pluto.emitEvent("music::play", {id:"test"});
    });
    it("should download and play song links", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {}
            }
        });

        var download = nock("http://test.com")
        .get("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test.mp3", {
            "Content-Length": 4000000,
            "Content-Type": "audio/mpeg"
        })
        .head("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test.mp3", {
            "Content-Length": 4000000,
            "Content-Type": "audio/mpeg"
        });

        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        var linksRequested = false;
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            if (linksRequested) {
                callback("Couldn't play file", null);
            } else {
                linksRequested = true;
                callback(null, "http://test.com/test.mp3");
            }
        });

        pluto.addListener("player::download_error", function(err) {
            done(new Error(err));
        });

        pluto.addListener("music::next", function(data) {
            pluto.emitEvent("music::stop");
            try {
                assert.equal(songs["test"].url, "storage/songs/test.mp3");
                assert.equal(Math.floor(songs["test"].lastPlayed/100000), Math.floor(Date.now()/100000));
                done();
            } catch (err) {
                done(err);
            }
        });
        pluto.emitEvent("music::play", {id:"test", name:"test", artist:""});
    });
    it("should reject invalid content-types", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {}
            }
        });

        var download = nock("http://test.com")
        .get("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test-broken.html", {
            "Content-Length": 4000000,
            "Content-Type": "text/html"
        })
        .head("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test-broken.html", {
            "Content-Length": 4000000,
            "Content-Type": "text/html"
        });

        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        var linksRequested = false;
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            if (linksRequested) {
                done();
            } else {
                linksRequested = true;
                callback(null, "http://test.com/test.mp3");
            }
        });

        pluto.addListener("player::download_error", function(err) {
            done(new Error(err));
        });

        pluto.addListener("player::progress", function(data) {
            pluto.emitEvent("music::stop");
            done(new Error("Nothing should be playing"))
        });

        player.handleBadSong = function() {
            done(new Error("The should have been no play attempts"));
        };

        pluto.emitEvent("music::play", {id:"test", name:"test", artist:""});
    });
    it("should reject small files", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {}
            }
        });

        var download = nock("http://test.com")
        .get("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test.mp3", {
            "Content-Length": 1000,
            "Content-Type": "audio/mpeg"
        })
        .head("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test.mp3", {
            "Content-Length": 1000,
            "Content-Type": "audio/mpeg"
        });

        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        var linksRequested = false;
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            if (linksRequested) {
                done();
            } else {
                linksRequested = true;
                try {
                    callback(null, "http://test.com/test.mp3");
                } catch (err) {
                    console.log("got error: " + err);
                    throw err;
                }
            }
        });

        pluto.addListener("player::download_error", function(err) {
            done(new Error(err));
        });

        pluto.addListener("player::progress", function(data) {
            pluto.emitEvent("music::stop");
            done(new Error("Nothing should be playing"))
        });

        player.handleBadSong = function() {
            done(new Error("The should have been no play attempts"));
        };

        pluto.emitEvent("music::play", {id:"test", name:"test", artist:""});
    });
    it("should stop downloads when a song is skipped", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                songs: {}
            }
        });

        var download = nock("http://test.com")
        .get("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test.mp3", {
            "Content-Length": 4000000,
            "Content-Type": "audio/mpeg"
        })
        .head("/test.mp3")
        .replyWithFile(200, __dirname + "/data/test.mp3", {
            "Content-Length": 4000000,
            "Content-Type": "audio/mpeg"
        });

        var player = require("../plugins/player.js")(pluto);
        pluto.addModule(player);
        pluto.listen();
        var songs = pluto.getStorage("songs");

        var linksRequested = false;
        pluto.addListener("muzik::get_link", function(song, ignore, callback) {
            if (linksRequested) {
                callback("Couldn't play file", null);
            } else {
                linksRequested = true;
                callback(null, "http://test.com/test.mp3");
            }
        });

        pluto.addListener("player::download_error", function(err) {
            done(new Error(err));
        });

        pluto.addListener("player::progress", function(data) {
            pluto.emitEvent("music::stop");
            done(new Error("Nothing should be playing"))
        });

        player.handleBadSong = function() {
            done(new Error("The should have been no play attempts"));
        };

        pluto.addListener("player::download_started", function(request) {
            try {
                pluto.emitEvent("music::stop");
                assert.ok(request._aborted);
                done();
            } catch (err) {
                done(err);
            }
        });

        pluto.emitEvent("music::play", {id:"test", name:"test", artist:""});
    });
});
