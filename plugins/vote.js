module.exports = function(pluto) {
    var path = require("path");
    var fs = require('fs');

    var voteModule = {};
    voteModule.last = "";

    var data = pluto.getStorage("users")||{};
    voteModule.currentVote = 0;

    var title = "Vote!"

    voteModule.isDone = function() {
        if (voteModule.currentVote.yes.length > Math.floor((Object.keys(data).length-1)/2)) {
            voteModule.last = "yes";
            pluto.emitEvent("points::awardTo", data[voteModule.currentVote.user], parseInt(voteModule.currentVote.points));
            voteModule.currentVote = {};
            return true;
        } else if (voteModule.currentVote.no.length > Math.floor((Object.keys(data).length-1)/2)) {
            voteModule.last = "no";
            voteModule.currentVote = {};
            return true;
        } else if (voteModule.currentVote.no.length+voteModule.currentVote.yes.length >= Object.keys(data).length-1) {
            voteModule.last = "no";
            voteModule.currentVote = {};
            return true;
        } else {
            return false;
        }
    };

    pluto.post("/vote/new", function(req, res) {
        var id = pluto.getId(req, res);

        if (voteModule.currentVote) {
            res.render("vote.html", {
                title: title,
                message: "Can't make a new vote, there's already a vote running!"
            })
        } else {
            var voteUser = 0;
            for (var user in data) {
                if (data[user].name.indexOf(req.body.user) != -1) {
                    voteUser = data[user].id;
                    break;
                }
            }
            if (voteUser) {
                voteModule.currentVote = {
                    user: voteUser,
                    points: req.body.points,
                    yes: [id],
                    no: []
                };
                res.render("vote.html", {
                    title: title,
                    message: "Vote created! Send users to <strong>/vote</strong> to vote."
                });
            } else {
                res.render("vote.html", {
                    title: title,
                    message: "User does not exist."
                })
            }
        }
    });

    pluto.get("/vote/:vote", function(req, res) {
        var id = pluto.getId(req, res);
        var vote = decodeURIComponent(req.params.vote);

        if (data[id]) {
            var user = decodeURIComponent(req.params.user);

            if (vote == "yes" || vote == "no") {
                voteModule.currentVote.yes = voteModule.currentVote.yes.filter(function(element) {
                    return (element != id);
                });
                voteModule.currentVote.no = voteModule.currentVote.no.filter(function(element) {
                    return (element != id);
                });

                voteModule.currentVote[vote].push(id);
                if (voteModule.isDone()) {
                    res.render("vote.html", {
                        title: title,
                        message: "Vote complete! The winner was <strong>" + voteModule.last + "!</strong>"
                    });
                } else {
                    res.render("vote.html", {
                        title: title,
                        message: "Your vote has been cast."
                    });
                }
            } else {
                res.render("vote.html", {
                    title: title,
                    message: "I don't know what you're trying to vote for!"
                });
            }

        } else {
            res.render("vote.html", {
                title: title,
                message: "Hey, you're not a registered user!"
            });
        }
    });

    pluto.get("/vote", function(req, res) {
        if (voteModule.currentVote) {
            res.render("vote.html", {
                title: title,
                form: true,
                yes: voteModule.currentVote.yes.length,
                no: voteModule.currentVote.no.length,
                user: data[voteModule.currentVote.user].name,
                points: voteModule.currentVote.points
            });
        } else {
            res.render("vote.html", {
                title: title,
                message: "There's no current vote."
            });
        }
    });




    return voteModule;
};
