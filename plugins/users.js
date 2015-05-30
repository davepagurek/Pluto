module.exports = function(pluto) {
    var path = require("path");
    var fs = require('fs');

    var usersModule = {};

    var data = pluto.getStorage("users");
    var listening = 0;

    var title = "Manage Users";


    pluto.get("/users/all", function(req, res) {
       res.send(data);
    });

    pluto.get("/users", function(req, res) {
        var users = [];
        for (var user in data) {
            users.push(data[user]);
            users[users.length-1].encodedid = encodeURIComponent(users[users.length-1].id);
        }
        res.render("users-manage.html", {
            "users": users,
            "title": title
        });
    });

    pluto.post("/users/add", function(req, res) {
        var users = [];
        for (var user in data) {
            users.push(data[user]);
            users[users.length-1].encodedid = encodeURIComponent(users[users.length-1].id);
        }
        var name = req.body.name;
        var github = req.body.github;
        var artists = req.body.artists || "";


        if (!listening) {
            listening = {
                "id": 0,
                "name": name,
                "github": github,
                "artists": artists.split(",")
            };
            res.render("users-manage.html", {
                "users": users,
                "title": title,
                "message": "User " + name + " added. Make the user go to <strong>/users/io</strong> to register an id."
            });
        } else {
            res.status(409);
            res.render("users-manage.html", {
                "users": users,
                "title": title,
                "message": "Can't add a new user yet, we're waiting for " + listening.name + " to register their id!"
            });
        }
    });

    pluto.post("/users/change", function(req, res) {
        var users = [];
        for (var user in data) {
            users.push(data[user]);
            users[users.length-1].encodedid = encodeURIComponent(users[users.length-1].id);
        }
        var id = req.body.id;
        var newid = req.body.newid;
        var name = req.body.name;
        var del = req.body.delete;
        var github = req.body.github;
        var artists = req.body.artists;
        var image = 0;
        if (req.files) image = req.files.image;

        if (data[id]) {
            if (del) {
                if (data[id].image && data[id].image.length>0 && fs.existsSync("./public/uploads/" + data[id].image)) fs.unlinkSync("./public/uploads/" + data[id].image);
                delete data[id];
                res.send("User deleted.");
            } else {
                if (name) data[id].name = name;
                if (github) data[id].github = github;
                if (artists) data[id].artists = artists.split(",");
                if (image) {
                    if (data[id].image && data[id].image.length>0 && fs.existsSync("./public/uploads/" + data[id].image)) fs.unlinkSync("./public/uploads/" + data[id].image);
                    data[id].image = req.files.image.name;
                }
                if (newid && newid != id) {
                    data[id].id = newid;
                    data[newid] = data[id];
                    delete data[id];
                }
                res.render("users-manage.html", {
                    "users": users,
                    "title": title,
                    "message": "User changed."
                });
            }
            pluto.saveStorage("users");
        } else {
            res.render("users-manage.html", {
                "users": users,
                "title": title,
                "message": "User does not exist."
            });
        }
    });

    pluto.get("/users/io", function(req, res) {
        var users = [];
        for (var user in data) {
            users.push(data[user]);
            users[users.length-1].encodedid = encodeURIComponent(users[users.length-1].id);
        }
        var id = pluto.getId(req, res);

        if (listening) {
            listening.id = id;
            listening.in = true;
            data[id] = listening;
            listening = 0;

            pluto.emitEvent("users::register", data[id]);

            pluto.saveStorage("users");

            res.render("users-manage.html", {
                "users": users,
                "title": title,
                "message": data[id].name + " registered!"
            });

        } else if (data[id]) {
            data[id].in = (data[id].in?false:true);

            pluto.emitEvent("users::sign" + (data[id].in?"in":"out"), data[id]);

            pluto.saveStorage("users");

            res.render("users-manage.html", {
                "users": users,
                "title": title,
                "message": data[id].name + " signed " + (data[id].in?"in":"out") + "!"
            });
        } else {
            res.render("users-manage.html", {
                "users": users,
                "title": title,
                "message": "User does not exist: " + id
            });
        }
    });

    return usersModule;
};
