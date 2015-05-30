var assert = require("assert");

describe("github", function(){
    it("should parse streak data from github", function() {
        var pluto = require("../Pluto/pluto.js")({
            testRequests: {
                "https://github.com/test": '<span class="text-muted">Current streak</span> <span class="contrib-number">20 days</span>'
            },
            testData: {
                users: {
                    "test": {
                        github: "test",
                        id: "test"
                    }
                }
            }
        });
        var callbackRan = false;
        var callback = function(user, data) {
            callbackRan = true;
            assert.equal(user.id, "test");
            assert.equal(data, 20)
        }
        pluto.addListener("points::awardTo", callback)
        var githubModule = require("../plugins/github.js")(pluto);
        pluto.addModule(githubModule);
        pluto.listen();
        assert.equal(callbackRan, true);
    });
});
