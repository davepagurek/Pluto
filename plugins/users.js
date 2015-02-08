module.exports = function(pluto) {
    var usersModule = {};

    var data = {};
    var listening = 0;


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
        var name = req.body.name;

        if (!listening) {
            listening = {
                "ip": 0,
                "name": name
            };
            res.send("User " + name + " added. Make the user go to <strong>/users/io</strong> to register an IP.");
        } else {
            res.send("Can't add a new user yet, we're waiting for " + listening.name + " to register their IP!");
        }
    });

    pluto.post("/users/change", function(req, res) {
        var ip = req.body.ip;
        var name = req.body.name;
        var del = req.body.delete;

        if (data[ip]) {
            if (del) {
                delete data[ip];
                res.send("User deleted.");
            } else {
                if (name) data[ip].name = name;
                res.send("User changed.");
            }
            pluto.saveStorage("users", data);
        } else {
            res.send("User does not exist.");
        }
    });

    pluto.get("/users/io", function(req, res) {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (listening) {
            listening.ip = ip;
            data[ip] = listening;
            listening = 0;

            pluto.emitEvent("users::register", data[ip]);

            pluto.saveStorage("users", data);

            res.send(data[ip].name + " registered!");

        } else if (data[ip]) {
            data[ip].in = !data[ip].in;

            pluto.emitEvent("users::sign" + (data[ip].in?"in":"out"), data[ip]);

            pluto.saveStorage("users", data);

            res.send(data[ip].name + " signed " + (data[ip].in?"in":"out") + "!");
        } else {
            res.send("User does not exist.");
        }
    });

    return usersModule;
};
