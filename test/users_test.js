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
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                request(pluto.app)
                    .post("/users/add")
                    .expect(409)
                    .end(done);
            });
    });

    it("should add a user after they register", function(done) {
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
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                request(pluto.app)
                    .get("/users/io")
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);
                        assert.equal(pluto.getStorage("users")["test"].in, true);
                        done();
                    });
            });
    });

    it("should sign out a user who is in when they GET /users/io", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            getId: function(req, res) {
                return "test";
            },
            testData: {
                users: {
                    "test": {
                        in: true
                    }
                }
            }
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .get("/users/io")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                assert.equal(pluto.getStorage("users")["test"].in, false)
                done()
            });
    });

    it("should sign in a user who is out when they GET /users/io", function(done) {
        var pluto = require("../Pluto/pluto.js")({
            id: "TEST",
            getId: function(req, res) {
                return "test";
            },
            testData: {
                users: {
                    "test": {
                        in: false
                    }
                }
            }
        });
        var usersModule = require("../plugins/users.js")(pluto);
        pluto.addModule(usersModule);
        pluto.listen();

        request(pluto.app)
            .get("/users/io")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                assert.equal(pluto.getStorage("users")["test"].in, true)
                done()
            });
    });
});
