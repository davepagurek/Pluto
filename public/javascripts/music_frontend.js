autoUpdate("download_progress_container", "/music/downloading", 4);

var currentTime = null;
var totalTime = null;
var lastSongResponse = null;
var songTimer = null;
var songProgressContainer = document.getElementById("song_progress_container");
var updateProgressFromServer = function() {
    ajax("GET", "/music/progress", function(response) {
        if (response == lastSongResponse) return;

        if (response == "{}") {
            songProgressContainer.innerHTML = "";
            clearInterval(songTimer);
            songTimer = null;
        } else {
            progress = JSON.parse(response, songTimer);
            currentTime = progress.current;
            totalTime = progress.total;
            if (!songTimer && progress.playing) {
                songTimer = setInterval(function() {
                    currentTime++;
                    songProgressContainer.innerHTML = "" + secondsToTime(currentTime) + " / " + secondsToTime(totalTime);
                }, 1000);
            } else if (songTimer && !progress.playing) {
                clearInterval(songTimer);
                songTimer = null;
            }
        }

        lastSongResponse = response;
    });
}

if (songProgressContainer) {
    setInterval(updateProgressFromServer, 10000);
    updateProgressFromServer();
}

