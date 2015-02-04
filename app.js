var express = require('express');


var app = express();

var pluto = require("Pluto/pluto")(app);

//pluto.addSource(require("plugins/users"));



module.exports = app;
