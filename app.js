var pluto = require("./Pluto/pluto.js")({
	"tts": "espeak"
});

//Keeps track of if users are IN or OUT by.
//listening for GET requests to /user/io
pluto.addModule("users", require("./plugins/users.js")(pluto));





//Use Spotify as a source for music info
pluto.addModule("spotify", require("./plugins/spotify.js")(pluto));

//Use Google Play Music as a source for music info
pluto.addModule("gpm", require("./plugins/gpm.js")(pluto));

//Makes a playlist based on user recommended artists
pluto.addModule("music", require("./plugins/music.js")(pluto));




pluto.addModule("newsTicker", require("./plugins/news_ticker.js")(pluto));

//Outputs "Hello, <username>!" in the console
//when a new user enters
pluto.addModule("welcome", require("./plugins/welcome.js")(pluto));

//Keeps track of how many awesomepoints people have
pluto.addModule("awesomepoints", require("./plugins/awesomepoints.js")(pluto));

//Gives out awesomepoints for GitHub streaks
pluto.addModule("github", require("./plugins/github.js")(pluto));

//Allows users to vote to give points
pluto.addModule("vote", require("./plugins/vote.js")(pluto));

//Shows a dashboard for users
pluto.addModule("display", require("./plugins/display.js")(pluto));

//Play music with mplayer
pluto.addModule("player", require("./plugins/player.js")(pluto));

//Open a trello board
pluto.addModule("trello", require("./plugins/trellohandler.js")(pluto));

//Get music downloads from Muzik
pluto.addModule("muzikDriver", require("./plugins/muzikdriver.js")(pluto));


pluto.listen(process.env.PORT || 3000);

