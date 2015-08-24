module.exports = function(pluto) {
    var displayModule = {};
    var users = pluto.getStorage("users");
    var news = pluto.getStorage("newsresults");
    pluto.get("/", function(req, res) {
        res.render("display.html", {
            "users": users,
            "layout": false,
            "news":news
        });
    });

    return displayModule;
};
