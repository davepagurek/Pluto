var express = require('express');


var app = express();

var pluto = require("./Pluto/pluto.js")();

pluto.addSource(require("./plugins/users.js")(pluto));

app.use("/", pluto.router);

app.listen(3000);


module.exports = app;
