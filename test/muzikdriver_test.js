var assert = require("assert");

describe("muzikdriver", function(){
    it("should return the closest title match first", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "http://muzik.elasticbeanstalk.com/search?songname=We%20Used%20To%20Wait Arcade%20Fire": {
                    status: 200,
                    body: JSON.stringify({
                        albumArt: "",
                        url: [
                            {"Arcade Fire - We Used To Wait": "right.mp3"},
                            {"Arcad Frie - We Wait": "wrong1.mp3"},
                            {"Eminem - Lose Yourself": "wrong2.mp3"}
                        ]
                    })
                }
            }
        });
        var muzik = require("../plugins/muzikdriver.js")(pluto);
        pluto.addModule(muzik);
        pluto.listen();
        var song = {
            name: "We Used To Wait",
            artist: "Arcade Fire",
            album: "The Suburbs"
        };
        pluto.emitEvent("muzik::get_link", song, [], function(err, url) {
            try {
                assert.equal(err, null);
                assert.equal(url, "right.mp3");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
    it("should favour mp3 files", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "http://muzik.elasticbeanstalk.com/search?songname=We%20Used%20To%20Wait Arcade%20Fire": {
                    status: 200,
                    body: JSON.stringify({
                        albumArt: "",
                        url: [
                            {"Arcade Fire - We Used To Wait": "right.mp3"},
                            {"Arcade Fire - We Used To Wait": "wrong"}
                        ]
                    })
                }
            }
        });
        var muzik = require("../plugins/muzikdriver.js")(pluto);
        pluto.addModule(muzik);
        pluto.listen();
        var song = {
            name: "We Used To Wait",
            artist: "Arcade Fire",
            album: "The Suburbs"
        };
        pluto.emitEvent("muzik::get_link", song, [], function(err, url) {
            try {
                assert.equal(err, null);
                assert.equal(url, "right.mp3");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
    it("should respect ignored urls", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "http://muzik.elasticbeanstalk.com/search?songname=We%20Used%20To%20Wait Arcade%20Fire": {
                    status: 200,
                    body: JSON.stringify({
                        albumArt: "",
                        url: [
                            {"Arcade Fire - We Used To Wait": "ignored.mp3"},
                            {"We Wait sometimes I guess lol": "right.mp3"}
                        ]
                    })
                }
            }
        });
        var muzik = require("../plugins/muzikdriver.js")(pluto);
        pluto.addModule(muzik);
        pluto.listen();
        var song = {
            name: "We Used To Wait",
            artist: "Arcade Fire",
            album: "The Suburbs"
        };
        pluto.emitEvent("muzik::get_link", song, ["ignored.mp3"], function(err, url) {
            try {
                assert.equal(err, null);
                assert.equal(url, "right.mp3");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
    it("should return an error when all urls are ignored", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "http://muzik.elasticbeanstalk.com/search?songname=We%20Used%20To%20Wait Arcade%20Fire": {
                    status: 200,
                    body: JSON.stringify({
                        albumArt: "",
                        url: [
                            {"Arcade Fire - We Used To Wait": "ignored1.mp3"},
                            {"Arcade Fire - We Used To Wait": "ignored2.mp3"},
                        ]
                    })
                }
            }
        });
        var muzik = require("../plugins/muzikdriver.js")(pluto);
        pluto.addModule(muzik);
        pluto.listen();
        var song = {
            name: "We Used To Wait",
            artist: "Arcade Fire",
            album: "The Suburbs"
        };
        pluto.emitEvent("muzik::get_link", song, ["ignored1.mp3", "ignored2.mp3"], function(err, url) {
            try {
                assert.equal(err, "No results", "An error should be returned");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
    it("should return an error when invalid JSON is returned", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "http://muzik.elasticbeanstalk.com/search?songname=We%20Used%20To%20Wait Arcade%20Fire": {
                    status: 200,
                    body: "{url: [}"
                }
            }
        });
        var muzik = require("../plugins/muzikdriver.js")(pluto);
        pluto.addModule(muzik);
        pluto.listen();
        var song = {
            name: "We Used To Wait",
            artist: "Arcade Fire",
            album: "The Suburbs"
        };
        pluto.emitEvent("muzik::get_link", song, [], function(err, url) {
            try {
                assert.ok(err.match(/Error parsing result/), "An error should be returned");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
    it("should return an error when no data is returned", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "http://muzik.elasticbeanstalk.com/search?songname=We%20Used%20To%20Wait Arcade%20Fire": {
                    status: 200,
                    body: '{ "url": [] }'
                }
            }
        });
        var muzik = require("../plugins/muzikdriver.js")(pluto);
        pluto.addModule(muzik);
        pluto.listen();
        var song = {
            name: "We Used To Wait",
            artist: "Arcade Fire",
            album: "The Suburbs"
        };
        pluto.emitEvent("muzik::get_link", song, [], function(err, url) {
            try {
                assert.equal(err, "No results", "An error should be returned");
                done();
            } catch (err) {
                done(err);
            }
        });
    });
});
