function ajax(method, url, callback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
           if(xmlhttp.status == 200){
               callback(xmlhttp.responseText);
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
    var update = function() {
        ajax("GET", url, function(response) {
            document.getElementById(id).innerHTML = response;
        });
    }
    setInterval(update, interval*1000);
    update();
}
