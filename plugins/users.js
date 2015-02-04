module.exports = function(pluto) {
    var usersModule = {};

    var data = {};

    pluto.getStorage("users", function(error, response) {
        if (response) data = response;
    });

    pluto.get("/test", function(req, res) {
        res.send("test");
    });

    pluto.get("/users/:userid/in", function(req, res) {
        var userid = req.params.userid;
        res.send(userid + " signed in!");

        if (!data[userid]) {
            data[userid] = {
                "name": userid
            };
        }
        data[userid].in = true;

        pluto.emitEvent("users::signin", data[userid]);

        pluto.saveStorage("users", data, function(err) {
            if (err) throw err;
        });
    });

    pluto.get("/users/:userid/out", function(req, res) {
        var userid = req.params.userid;
        res.send(userid + " signed out!");
        if (!data[userid]) {
            data[userid] = {
                "name": userid
            };
        }
        data[userid].in = false;

        pluto.emitEvent("users::signout", data[userid]);

        pluto.saveStorage("users", data, function(err) {
            if (err) throw err;
        });
    });

    return usersModule;
};
