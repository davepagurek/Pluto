module.exports = function(pluto) {
    require('es6-promise').polyfill();
    var request = require('popsicle');

    var githubModule = {};

    var data = pluto.getStorage("github");
    var users = pluto.getStorage("users");

    githubModule.checkGithub = function(user) {
        if (users[user].github) {
            console.log("Requesting " + "https://github.com/" + users[user].github);
            pluto.request("https://github.com/" + users[user].github, function(res) {
                var match = /<span class="text-muted">Current streak<\/span>\s+<span class="contrib-number">([0-9]+) day(?:s?)<\/span>/.exec(res.body);
                if (match) {
                    pluto.emitEvent("points::awardTo", users[user], parseInt(match[1]));
                }
            });
        }
    };

    //Run this every four hours to make sure it doesn't wait too long
    pluto.schedule(4, function() {

        //But only actually check github 24 hours after the initial time
        if (!data.lastCheck || new Date().getTime() - data.lastCheck >= 24*60*60*1000) {
            for (var user in users) {
                githubModule.checkGithub(user);
            }

            data.lastCheck = new Date().getTime();
            pluto.saveStorage("github");
        }
    });

    pluto.addListener("users::register", function(user) {
        githubModule.checkGithub(user.username);
    });

    return githubModule;
};
