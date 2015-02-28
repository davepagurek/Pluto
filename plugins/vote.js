module.exports = function(pluto) {
    var path = require("path");
    var fs = require('fs');

    var voteModule = {};
    var last = "";

    var data = pluto.getStorage("users")||{};
    var currentVote = 0;

    var isDone = function() {
        if (currentVote.yes.length > Math.floor(Object.keys(data).length/2)) {
            last = "yes";
            pluto.emitEvent("points::awardTo", data[currentVote.user], parseInt(currentVote.points));
            currentVote = {};
            return true;
        } else if (currentVote.no.length > Math.floor(Object.keys(data).length/2)) {
            last = "no";
            currentVote = {};
            return true;
        } else if (currentVote.no.length+currentVote.yes.length >= Object.keys(data).length) {
            last = "no";
            currentVote = {};
            return true;
        } else {
            return false;
        }
    };

    pluto.post("/vote/new", function(req, res) {
        var ip = req.cookies.plutoId || pluto.makeId(20);

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

    pluto.get("/vote/:vote", function(req, res) {
        var ip = req.cookies.plutoId || pluto.makeId(20);
        var vote = decodeURIComponent(req.params.vote);

        if (data[ip]) {
            var user = decodeURIComponent(req.params.user);

            if (vote == "yes" || vote == "no") {
                currentVote.yes = currentVote.yes.filter(function(element) {
                    return (element != ip);
                });
                currentVote.no = currentVote.no.filter(function(element) {
                    return (element != ip);
                });

                currentVote[vote].push(ip);
                if (isDone()) {
                    res.send("Vote complete! The winner was <strong>" + last + "!</strong>");
                } else {
                    res.send("Your vote has been cast.");
                }
            } else {
                res.send("I don't know what you're trying to vote for!");
            }

        } else {
            res.send("Hey, you're not a registered user!");
        }
    });

    pluto.get("/vote", function(req, res) {
        if (currentVote) {
            res.render("vote.html", {
                yes: currentVote.yes.length,
                no: currentVote.no.length,
                user: data[currentVote.user].name,
                points: currentVote.points
            });
        } else {
            res.send("There's no current vote.");
        }
    });




    return voteModule;
};
