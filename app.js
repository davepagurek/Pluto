var express = require('express');


var app = express();

var pluto = require("./Pluto/pluto.js")(app);

pluto.addSource(require("./plugins/users.js"));

app.listen(3000);


module.exports = app;
