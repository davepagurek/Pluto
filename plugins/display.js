module.exports = function(pluto) {
    var displayModule = {};
    var users = pluto.getStorage("users");
    pluto.get("/", function(req, res) {
        res.render("display.html", {
            "users": users,
            "layout": false,
            "news":null
        });
    });

    return displayModule;
};
