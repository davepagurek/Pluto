var assert = require("assert");

describe("awesomepoints", function(){
    it("should be added to users on a points::awardTo event", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "test": {
                        name: "test",
                        points: 5
                    }
                }
            }
        });
        var awesomepointsModule = require("../plugins/awesomepoints.js")(pluto);
        pluto.addModule("awesomepoints", awesomepointsModule);
        pluto.listen();
        pluto.emitEvent("points::awardTo", pluto.getStorage("users")["test"], 5)
        assert.equal(pluto.getStorage("users")["test"].points, 10);
    });

    it("should still add points when a user.points is undefined", function() {
        var pluto = require("../Pluto/pluto.js")({
            testData: {
                users: {
                    "test": {
                        name: "test"
                    }
                }
            }
        });
        var awesomepointsModule = require("../plugins/awesomepoints.js")(pluto);
        pluto.addModule("awesomepoints", awesomepointsModule);
        pluto.listen();
        pluto.emitEvent("points::awardTo", pluto.getStorage("users")["test"], 5)
        assert.equal(pluto.getStorage("users")["test"].points, 5);
    });
});
