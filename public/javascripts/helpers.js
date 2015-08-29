function ajax(method, url, callback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
           if(xmlhttp.status == 200){
               if (callback) callback(xmlhttp.responseText);
           } else if(xmlhttp.status == 400) {
               console.error('There was an error 400');
           } else {
               console.error('something else other than 200 was returned');
           }
        }
    }

    xmlhttp.open(method, url, true);
    xmlhttp.send();
}

function autoUpdate(id, url, interval) {
    var container = document.getElementById(id);
    if (!container) return;

    var update = function() {
        ajax("GET", url, function(response) {
            container.innerHTML = response;
        });
    }
    setInterval(update, interval*1000);
    update();
}

function secondsToTime(totalSeconds) {
    var hours   = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
    var seconds = totalSeconds - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}
