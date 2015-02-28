module.exports = function(pluto) {
    var path = require("path");
    var fs = require('fs');

    var voteModule = {};

    var data = pluto.getStorage("users")||{};
    var currentVote = 0;

    pluto.post("/vote/new", function(req, res) {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (currentVote) {
            res.send("Can't make a new vote, there's already a vote running!");
        } else {
            var voteUser = 0;
            for (var user in data) {
                if (data[user].name.indexOf(req.body.user) != -1) {
                    voteUser = data[user].ip;
                    break;
                }
            }
            if (voteUser) {
                currentVote = {
                    user: voteUser,
                    points: req.body.points,
                    yes: [ip],
                    no: []
                };
                res.send("Vote created! Send users to <strong>/vote</strong> to vote.");
            } else {
                res.send("User does not exist.");
            }
        }
    });

    pluto.get("/vote", function(req, res) {
        res.render("vote.html", {
            yes: currentVote.yes.length,
            no: currentVote.no.length,
            user: data[currentVote.user].name,
            points: currentVote.points
        });
    });




    return voteModule;
};
