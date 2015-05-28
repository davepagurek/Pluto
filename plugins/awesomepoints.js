module.exports = function(pluto) {
    require("shelljs/global");
    require('es6-promise').polyfill();
    var request = require('popsicle');
    var pointsModule = {};
    var data = pluto.getStorage("users")||{};



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
        if (data[user.id]) {
            if(data[user.id].points)
                data[user.id].points += increment;
            else
                data[user.id].points = increment;

            pluto.saveStorage("users", data, function() {
                //saved!
                pluto.emitEvent("users::updated");
            });
        } else {
            console.log("Error awarding points")
        }
    });

    return pointsModule;
}
