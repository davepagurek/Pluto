var pluto = require("./Pluto/pluto.js")({
	"id": "IP"
});

// SOURCES

//Keeps track of if users are IN or OUT by.
//listening for GET requests to /user/io
pluto.addModule(require("./plugins/users.js")(pluto));

//Makes a playlist based on user recommended artists
pluto.addModule(require("./plugins/music.js")(pluto));



//ACTIONS

//Outputs "Hello, <username>!" in the console
//when a new user enters
pluto.addModule(require("./plugins/welcome.js")(pluto));

//Keeps track of how many awesomepoints people have
pluto.addModule(require("./plugins/awesomepoints.js")(pluto));

//Gives out awesomepoints for GitHub streaks
pluto.addModule(require("./plugins/github.js")(pluto));

//Allows users to vote to give points
pluto.addModule(require("./plugins/vote.js")(pluto));

//Shows a dashboard for users
pluto.addModule(require("./plugins/display.js")(pluto));

//Play music with Spotify
//pluto.addModule(require("./plugins/spotify.js")(pluto));

//Play music with Muzik
pluto.addModule(require("./plugins/muzik.js")(pluto));


pluto.listen(process.env.PORT || 3000);

