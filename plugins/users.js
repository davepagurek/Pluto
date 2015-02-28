module.exports = function(pluto) {
    var path = require("path");
    var fs = require('fs');

    var usersModule = {};

    var data = pluto.getStorage("users")||{};
    var listening = 0;

    var makeId = function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };


    pluto.get("/users/all", function(req, res) {
       res.send(data);
    });

    pluto.get("/users", function(req, res) {
        var users = [];
        for (var user in data) {
            users.push(data[user]);
            users[users.length-1].encodedIP = encodeURIComponent(users[users.length-1].ip);
        }
        res.render("users-manage.html", {
            "users": users
        });
    });

    pluto.post("/users/add", function(req, res) {
        var name = req.body.name;
        var github = req.body.github;
        var artists = req.body.artists || "";


        if (!listening) {
            listening = {
                "ip": 0,
                "name": name,
                "github": github,
                "artists": artists.split(",")
            };
            res.send("User " + name + " added. Make the user go to <strong>/users/io</strong> to register an IP.");
        } else {
            res.send("Can't add a new user yet, we're waiting for " + listening.name + " to register their IP!");
        }
    });

    pluto.post("/users/change", function(req, res) {
        var ip = req.body.ip;
        var newip = req.body.newip;
        var name = req.body.name;
        var del = req.body.delete;
        var github = req.body.github;
        var artists = req.body.artists;
        var image = 0;
        if (req.files) image = req.files.image;

        if (data[ip]) {
            if (del) {
                if (data[ip].image && data[ip].image.length>0 && fs.existsSync("./public/uploads/" + data[ip].image)) fs.unlinkSync("./public/uploads/" + data[ip].image);
                delete data[ip];
                res.send("User deleted.");
            } else {
                if (name) data[ip].name = name;
                if (github) data[ip].github = github;
                if (artists) data[ip].artists = artists.split(",");
                if (image) {
                    if (data[ip].image && data[ip].image.length>0 && fs.existsSync("./public/uploads/" + data[ip].image)) fs.unlinkSync("./public/uploads/" + data[ip].image);
                    data[ip].image = req.files.image.name;
                }
                if (newip && newip != ip) {
                    data[ip].ip = newip;
                    data[newip] = data[ip];
                    delete data[ip];
                }
                res.send("User changed.");
            }
            pluto.saveStorage("users", data);
        } else {
            res.send("User does not exist.");
        }
    });

    pluto.get("/users/io", function(req, res) {
        var ip = req.cookies.plutoId || makeId(20);

        if (listening) {
            res.cookie('plutoId', ip, { maxAge: 9000000000, httpOnly: true });
            listening.ip = ip;
            data[ip] = listening;
            listening = 0;

            pluto.emitEvent("users::register", data[ip]);

            pluto.saveStorage("users", data);

            res.send(data[ip].name + " registered!");

        } else if (data[ip]) {
            data[ip].in = (data[ip].in?false:true);

            pluto.emitEvent("users::sign" + (data[ip].in?"in":"out"), data[ip]);

            pluto.saveStorage("users", data);

            res.send(data[ip].name + " signed " + (data[ip].in?"in":"out") + "!");
        } else {
            res.send("User does not exist: " + ip + "\nUsers: " + JSON.stringify(data));
        }
    });

    return usersModule;
};
