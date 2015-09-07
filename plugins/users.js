module.exports = function(pluto) {
    var path = require("path");
    var fs = require('fs');

    var usersModule = {
        lastMessage: null,
        listening: null
    };

    var data = pluto.getStorage("users");

    var title = "Manage Users";


    pluto.get("/users/all", function(req, res) {
       res.send(data);
    });

    pluto.get("/users", function(req, res) {
        var users = [];
        for (var user in data) {
            data[user].addLink = "/users/" + data[user].username + "/add";
            users.push(data[user]);
        }
        res.render("users-manage.html", {
            users: users,
            title: title,
            listening: usersModule.listening,
            message: usersModule.lastMessage
        });
        usersModule.lastMessage = null;
    });

    pluto.post("/users/add", function(req, res) {
        var username = req.body.username;
        if (!username) {
            usersModule.lastMessage = "You need to specify a username!";
            return res.redirect("/users");
        }
        var name = req.body.name;
        if (!name) {
            usersModule.lastMessage = "You need to specify a name!";
            return res.redirect("/users");
        }
        var github = req.body.github;
        var artists = req.body.artists;
        var image = 0;
        if (req.files) image = req.files.image;

        if (!usersModule.listening) {
            usersModule.listening = {
                username: username,
                name: name,
                github: github,
                ids: [],
                in: false,
                artists: artists ? artists.split(/, ?/) : []
            };
            if (image) {
                usersModule.listening.image = image.name;
            }
            data[usersModule.listening.username] = usersModule.listening;
            pluto.saveStorage("users");
            usersModule.lastMessage = "User " + name + " added.";
        } else {
            usersModule.lastMessage = "Can't add a new user yet, we're waiting for " + usersModule.listening.name + " to register their id!";
        }
        res.redirect("/users");
    });

    pluto.post("/users/:username/add", function(req, res) {
        var user = data[req.params.username];
        if (!user) {
            usersModule.lastMessage = "User " + req.params.username + " does not exist.";
        } else {
            usersModule.listening = user;
        }
        res.redirect("/users");
    });

    pluto.post("/users/change", function(req, res) {
        var username = req.body.username;
        var newusername = req.body.newusername;
        var name = req.body.name;
        var del = req.body.delete;
        var github = req.body.github;
        var artists = req.body.artists;
        var ids = req.body.ids;
        var image = 0;
        if (req.files) image = req.files.image;

        if (data[username]) {
            if (del) {
                var deletedName = data[username].name;
                if (data[username].image && data[username].image.length>0 && fs.existsSync("./public/uploads/" + data[username].image))
                    fs.unlinkSync("./public/uploads/" + data[username].image);
                delete data[username];
                usersModule.lastMessage = "Deleted " + deletedName + "'s user.";
            } else {
                data[username].name = name;
                data[username].github = github;
                data[username].artists = artists ? artists.split(",") : [];
                if (!ids || ids == "") {
                    data[username].ids = [];
                } else {
                    data[username].ids = ids.split(/, ?/);
                }
                if (image) {
                    if (data[username].image && data[username].image.length>0 && fs.existsSync("./public/uploads/" + data[username].image))
                        fs.unlinkSync("./public/uploads/" + data[username].image);
                    data[username].image = image.name;
                }
                if (newusername && newusername != id) {
                    if (data[newusername]) {
                        usersModule.lastMessage = "A user already exists with the username " + newusername + ".";
                        return res.redirect("/users");
                    } else {
                        data[username].username = newusername;
                        data[newusername] = data[username];
                        delete data[username];
                    }
                }
                usersModule.lastMessage = "User changed.";
            }
            pluto.saveStorage("users");
        } else {
            usersModule.lastMessage = "User does not exist.";
        }
        res.redirect("/users");
    });

    pluto.post("/users/:id/io", function(req, res) {
        var id = req.params.id;
        if (!id) {
            usersModule.lastMessage = "No id specified.";
            return res.redirect("/users");
        }

        if (usersModule.listening) {
            usersModule.listening.ids.push(id);
            usersModule.listening.in = true;

            pluto.emitEvent("users::register", usersModule.listening);
            usersModule.lastMessage = usersModule.listening.name + " registered!";

            usersModule.listening = null;

            pluto.saveStorage("users");

        } else {
            var currentUser = null;
            for (var user in data) {
                if (data[user].ids.indexOf(id) != -1) {
                    currentUser = data[user];
                    break;
                }
            }

            if (!currentUser) {
                usersModule.lastMessage = "No user found for that id.";
                return res.redirect("/users");
            }

            currentUser.in = !currentUser.in;

            pluto.emitEvent("users::sign" + (currentUser.in?"in":"out"), currentUser);

            pluto.saveStorage("users");

            usersModule.lastMessage = currentUser.name + " signed " + (currentUser.in?"in":"out") + "!";
        }
        res.redirect("/users");
    });

    pluto.post("/users/cancel", function(req, res) {
        usersModule.listening = null;
        res.redirect("/users");
    });

    return usersModule;
};
