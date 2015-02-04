module.exports = function(app, pluto) {
    var usersModule = {};

    var data = {};

    pluto.getStorage("users", function(error, response) {
        if (response) data = response;
    });

    app.post("/users/:userid/in", function(req, res) {
        var userid = req.params.userid;
        res.send(userid + " signed in!");
        if (!data[userid]) {
            data[userid] = {};
        }
        data[userid].in = true;
        pluto.saveStorage(data);
    });

    app.post("/users/:userid/out", function(req, res) {
        var userid = req.params.userid;
        res.send(userid + " signed out!");
        if (!data[userid]) {
            data[userid] = {};
        }
        data[userid].in = false;
        pluto.saveStorage(data);
    });

    return usersModule;
};
