module.exports = function(pluto) {
    require('es6-promise').polyfill();
    var request = require('popsicle');

    var githubModule = {};

    var lastCheck = 0;
    var data = pluto.getStorage("users")||{};

    var lastCheck = pluto.getStorage("github")||0;

    //Run this every four hours to make sure it doesn't wait too long
    pluto.schedule(4, function() {

        //But only actually check github 24 hours after the initial time
        if (new Date().getTime() - lastCheck >= 24*60*60*1000) {
            for (var user in data) {
                console.log("Requesting " + "https://github.com/" + data[user].github);
                request("https://github.com/" + data[user].github).then(function(res) {
                    var match = /<span class="text-muted">Current streak<\/span>\s+<span class="contrib-number">([0-9]+) day(?:s?)<\/span>/.exec(res.body);
                    if (match) {
                        pluto.emitEvent("points::awardTo", data[user], parseInt(match[1]));
                    }
                });
            }

            lastCheck = new Date().getTime();
            pluto.saveStorage("github", lastCheck);
        }
    });

    return githubModule;
};
