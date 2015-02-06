module.exports = function(pluto) {
    var usersModule = {};

    var data = {};

    var header = function() {
        return "<html>\
            <body>\
            <head>\
            <title>Users</title>\
            <link rel='stylesheet' type='text/css' href='/stylesheets/users.css' />\
            </head>\
            <body>\
            <div class='container'>";
    };

    var footer = function() {
        return "</div>\
            </body>\
            </html>";
    }

    pluto.getStorage("users", function(error, response) {
        if (response) data = response;
    });

    pluto.get("/users/all", function(req, res) {
       res.send(data);
    });

    pluto.get("/users", function(req, res) {
        var types = {

        }

        var content = header() +
            "<h1>Users</h1>\
            <h2>Existing Users</h2>";

        for (var user in data) {
            content += "<form method='post' action='/users/change'>";
            content += "<h3>" + user + "</h3>\
                <input type='hidden' name='id' value='" + user + "' />";
            content += "<div class='value'>\
                <label>name</label>\
                <input name='name' type='text' value='" + data[user].name + "' />\
                </div>\
                <div class='value'>\
                <label>Delete</label>\
                <input name='delete' type='checkbox' />\
                </div>\
                <input type='submit' value='Change' />\
                </form>";
        }

        content += "<h2>Register new user</h2>\
            <form method='post' action='/users/add'>\
            <div class='value'>\
            <label>ID</label>\
            <input name='id' type='text' />\
            </div>\
            <div class='value'>\
            <label>Name</label>\
            <input name='name' type='text' />\
            </div>\
            <input type='submit' value='Add' />\
            </form>";

        content += footer();
        res.send(content);
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
