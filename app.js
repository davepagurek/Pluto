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

/*
 * awesomepoints.js
 * Keeps track of how many awesomepoints people have
 */
pluto.addModule(require("./plugins/awesomepoints.js")(pluto));

/*
 * github.js
 * Gives out awesomepoints for GitHub streaks
 */
pluto.addModule(require("./plugins/github.js")(pluto));

/*
 * music.js
 * Makes a playlist based on user recommended artists
 */
pluto.addModule(require("./plugins/music.js")(pluto));

pluto.addModule(require("./plugins/display.js")(pluto));


pluto.listen(3000);

