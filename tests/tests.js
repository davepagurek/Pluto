var should = require('should');

var pluto = require("./Pluto/pluto.js")(true); //true for tests
pluto.addSource(require("./plugins/users.js")(pluto));
pluto.addModule(require("./plugins/welcome.js")(pluto));
pluto.addModule(require("./plugins/awesomepoints.js")(pluto));
pluto.addModule(require("./plugins/github.js")(pluto));
pluto.addModule(require("./plugins/music.js")(pluto));
pluto.addModule(require("./plugins/display.js")(pluto));

pluto.listen(3000);

pluto.storage["users"] = {
    "::1": {
        "ip": "::1",
        "name": "Test User"
    }
};


