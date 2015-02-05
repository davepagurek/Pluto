var pluto = require("./Pluto/pluto.js")();

/*
 * users.js:
 * Keeps track of if users are IN or OUT by.
 * listening for GET requests to /user/<userid>/<in:out>
 */
pluto.addSource(require("./plugins/users.js")(pluto));

/*
 * welcome.js:
 * Outputs "Hello, <username>!" in the console
 * when a new user enters
 */
pluto.addModule(require("./plugins/welcome.js")(pluto));

pluto.listen(3000);

