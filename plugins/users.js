module.exports = function(pluto) {
    var usersModule = {};

    var data = {};


    pluto.getStorage("users", function(error, response) {
        if (response) data = response;
    });

    pluto.get("/users/all", function(req, res) {
       res.send(data);
    });

    pluto.get("/users", function(req, res) {
        var users = [];
        for (var user in data) {
            users.push(data[user]);
        }
        res.render("users-manage.html", {
            "users": users
        });
    });

    pluto.post("/users/add", function(req, res) {
        var id = req.body.id;
        var name = req.body.name;

        if (!data[id]) {
            data[id] = {
                "id": id,
                "name": name
            };
            pluto.saveStorage("users", data);
            res.send("User " + id + " added.");
        }
        res.send("User " + id + " already exists.");
    });

    pluto.post("/users/change", function(req, res) {
        var id = req.body.id;
        var name = req.body.name;
        var del = req.body.delete;

        if (data[id]) {
            if (del) {
                delete data[id];
                res.send("User " + id + " deleted.");
            } else {
                if (name) data[id].name = name;
                res.send("User " + id + " changed.");
            }
            pluto.saveStorage("users", data);
            res.send("User " + id + " added.");
        }
        res.send("User " + id + " does not exist.");
    });

    pluto.get("/users/:userid/in", function(req, res) {
        var userid = req.params.userid;
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (data[userid]) {
            data[userid].in = true;

            pluto.emitEvent("users::signin", data[userid]);

            pluto.saveStorage("users", data);

            res.send(userid + " signed in!");
        } else {
            res.send(userid + " does not exist.");
        }
    });

    pluto.get("/users/:userid/out", function(req, res) {
        var userid = req.params.userid;

        if (data[userid]) {
            data[userid].in = false;

            pluto.emitEvent("users::signout", data[userid]);

            pluto.saveStorage("users", data);

            res.send(userid + " signed out!");
        } else {
            res.send(userid + " does not exist.");
        }
    });

    return usersModule;
};
