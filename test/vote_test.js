var assert = require("assert");
var request = require('supertest');

describe("vote", function() {
    it("should end a vote when there is a majority for 'yes'", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "Leslie": {},
                    "Ron": {},
                    "April": {},
                    "Andy": {},
                    "Donna": {},
                    "Tom": {}
                }
            }
        });
        var voteModule = require("../plugins/vote.js")(pluto);
        pluto.addModule(voteModule);
        pluto.listen();

        voteModule.currentVote = {
            user: "Tom",
            points: 5,
            yes: ["Leslie", "Ron", "Andy", "Donna"],
            no: ["April"]
        }
        assert.equal(voteModule.isDone(), true);
        assert.equal(voteModule.last, "yes");
    });

    it("should end a vote when there is a majority for 'no'", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "Leslie": {},
                    "Ron": {},
                    "April": {},
                    "Andy": {},
                    "Donna": {},
                    "Tom": {},
                    "Ben": {}
                }
            }
        });
        var voteModule = require("../plugins/vote.js")(pluto);
        pluto.addModule(voteModule);
        pluto.listen();

        voteModule.currentVote = {
            user: "Ben",
            points: 5,
            yes: ["April"],
            no: ["Leslie", "Ron", "Andy", "Donna", "Tom"]
        }
        assert.equal(voteModule.isDone(), true);
        assert.equal(voteModule.last, "no");
    });

    it("should not assign points if there is a tie", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "Leslie": {},
                    "Ron": {},
                    "April": {},
                    "Andy": {},
                    "Donna": {},
                    "Tom": {},
                    "Ben": {}
                }
            }
        });
        var voteModule = require("../plugins/vote.js")(pluto);
        pluto.addModule(voteModule);
        pluto.listen();

        voteModule.currentVote = {
            user: "Ben",
            points: 5,
            yes: ["April", "Donna", "Tom"],
            no: ["Leslie", "Ron", "Andy"]
        }
        assert.equal(voteModule.isDone(), true);
        assert.equal(voteModule.last, "no");
    });

    it("should end a vote if there's no way for a side to win", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "Leslie": {},
                    "Ron": {},
                    "April": {},
                    "Andy": {},
                    "Donna": {},
                    "Tom": {},
                    "Ben": {}
                }
            }
        });
        var voteModule = require("../plugins/vote.js")(pluto);
        pluto.addModule(voteModule);
        pluto.listen();

        voteModule.currentVote = {
            user: "Ben",
            points: 5,
            yes: [],
            no: ["Leslie", "Ron", "Andy", "April"]
        }
        assert.equal(voteModule.isDone(), true);
        assert.equal(voteModule.last, "no");
    });

    it("should not end a vote if there is not a majority yet", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "Leslie": {},
                    "Ron": {},
                    "April": {},
                    "Andy": {},
                    "Donna": {},
                    "Tom": {},
                    "Ben": {}
                }
            }
        });
        var voteModule = require("../plugins/vote.js")(pluto);
        pluto.addModule(voteModule);
        pluto.listen();

        voteModule.currentVote = {
            user: "Ben",
            points: 5,
            yes: ["Leslie", "Ron"],
            no: ["April"]
        }
        assert.equal(voteModule.isDone(), false);
    });

});
