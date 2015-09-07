var assert = require("assert");
var request = require('supertest');

describe("users", function(){
    it("should only add one user at a time", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            getId: function(req, res) {
                return "test";
            },
            testData: {}
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .post("/users/add")
            .field("name", "test user")
            .expect(302)
            .end(function(err, res) {
                if (err) return done(err);
                request(pluto.app)
                    .post("/users/add")
                    .expect(302)
                    .end(function(err, res) {
                        if (err) return done(err);
                        try {
                            assert.ok(usersModule.lastMessage, "There should be an error message");
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
            });
    });

    it("should be able to cancel registering users", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            getId: function(req, res) {
                return "test";
            },
            testData: {}
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .post("/users/add")
            .field("name", "test user")
            .expect(302)
            .end(function(err, res) {
                if (err) return done(err);
                request(pluto.app)
                    .post("/users/cancel")
                    .expect(302)
                    .end(function(err, res) {
                        if (err) return done(err);
                        try {
                            assert.ok(!usersModule.listening, "It should not be waiting for anything to register");
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
            });
    });

    it("should add a user after they register", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            testData: {}
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .post("/users/add")
            .field("name", "test user")
            .field("username", "test")
            .expect(302)
            .end(function(err, res) {
                if (err) return done(err);
                request(pluto.app)
                    .post("/users/test/io")
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        try {
                            assert.equal(pluto.getStorage("users")["test"].in, true);
                            assert.equal(pluto.getStorage("users")["test"].ids[0], "test");
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
            });
    });

    it("should sign out a user who is in when they badge out", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            getId: function(req, res) {
                return "test";
            },
            testData: {
                users: {
                    "test": {
                        in: true,
                        ids: ["test"]
                    }
                }
            }
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .post("/users/test/io")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                try {
                    assert.equal(pluto.getStorage("users")["test"].in, false);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it("should sign in a user who is out when they badge in", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            getId: function(req, res) {
                return "test";
            },
            testData: {
                users: {
                    "test": {
                        in: false,
                        ids: ["test"]
                    }
                }
            }
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .post("/users/test/io")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                try {
                    assert.equal(pluto.getStorage("users")["test"].in, true);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });
});
