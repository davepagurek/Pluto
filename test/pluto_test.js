var assert = require("assert");

describe("Pluto", function(){
    var pluto = require("../Pluto/pluto.js")({
        "testData": {}
    });

    describe("event listeners", function(){
        it("should run callback when event triggered", function(){
            var callbackRan = false;
            pluto.addListener("test1", function() {
                callbackRan = true;
            });
            pluto.emitEvent("test1");
            assert.equal(callbackRan, true);
        });

        it("should be able to remove listeners", function() {
            var callbackRan = false;
            var callback = function() {
                callbackRan = true;
            };
            pluto.addListener("test2", callback);
            pluto.removeListener("test2", callback);
            pluto.emitEvent("test2");
            assert.equal(callbackRan, false);
        });
    });
});
