module.exports = function(pluto) {
    require("shelljs/global");
    var pointsModule = {};
    var data = pluto.getStorage("users");



    pluto.get("/score", function(req, res) {
        res.send("Everyone's a winner (unimplemented feature)");
    });
    pluto.get("/score/:user", function(req, res) {
        var user = decodeURIComponent(req.params.user);
        console.log(req.params.user, user);
        var points = data[user].points;
        if(points)
            res.send(data[user].name + " has " + points + " points!");
        else
            res.send("0");
    });

    pluto.addListener("points::awardTo", function(user,increment) {
        if (data[user.name]) {
            if(data[user.name].points)
                data[user.name].points += increment;
            else
                data[user.name].points = increment;

            pluto.saveStorage("users");
        } else {
            console.log("Error awarding points")
        }
    });

    return pointsModule;
}
