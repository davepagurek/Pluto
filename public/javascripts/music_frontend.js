autoUpdate("download_progress_container", "/music/downloading", 4);

var currentTime = null;
var totalTime = null;
var lastSongResponse = null;
var songTimer = null;
var songProgressContainer = document.getElementById("song_progress_container");
var updateProgressFromServer = function() {
    ajax("GET", "/music/progress/" + (window.currentID || "none"), function(err, response) {
        if (err) return console.error(err);
        if (response == lastSongResponse) return;

        if (response == "{}") {
            songProgressContainer.innerHTML = "";
            clearInterval(songTimer);
            songTimer = null;
        } else if (response == '{"reload": true}') {
            document.location.reload(true);
        } else {
            progress = JSON.parse(response, songTimer);
            currentTime = progress.current;
            totalTime = progress.total;
            if (!songTimer && progress.playing) {
                songTimer = setInterval(function() {
                    currentTime++;
                    songProgressContainer.innerHTML = "" + secondsToTime(currentTime) + " / " + (totalTime == "unknown" ? "unknown" : secondsToTime(totalTime));
                }, 1000);
            } else if (songTimer && !progress.playing) {
                clearInterval(songTimer);
                songTimer = null;
            }
        }

        lastSongResponse = response;
    });
};

if (songProgressContainer) {
    setInterval(updateProgressFromServer, 10000);
    setTimeout(updateProgressFromServer, 2000);
    updateProgressFromServer();
}

(function makeTabs() {

    tab_lists_anchors = document.querySelectorAll(".adding_tabs li a");
    divs = document.querySelectorAll("#tabs > div");
    for (var i = 0; i < tab_lists_anchors.length; i++) {
        if (tab_lists_anchors[i].classList.contains('active')) {
            divs[i].style.flex = "1";
        }

    }

    for (i = 0; i < tab_lists_anchors.length; i++) {

        document.querySelectorAll(".adding_tabs li a")[i].addEventListener('click', function(e) {

            for (i = 0; i < divs.length; i++) {
                divs[i].style.flex = null;
            }

            for (i = 0; i < tab_lists_anchors.length; i++) {
                tab_lists_anchors[i].classList.remove("active");
            }

            clicked_tab = e.target || e.srcElement;

            clicked_tab.classList.add('active');
            div_to_show = clicked_tab.getAttribute('href');
            console.log(document.querySelector(div_to_show));
            document.querySelector(div_to_show).style.flex = "1";

            e.preventDefault();
        });
    }

})();

