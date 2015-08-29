module.exports = function(pluto) {
    var Levenshtein = require("levenshtein");
    var muzik = {};

    pluto.addListener("muzik::get_link", function (song, ignore, callback) {
        var url = 'http://muzik.elasticbeanstalk.com/search?songname=' +
            encodeURIComponent(song.name) + " " +
            encodeURIComponent(song.artist);
        pluto.request(url, function(res){
            if (res.status != 200) {
                callback("Error " + res.status + " connecting to Muzik", null)
                return;
            }
            var body = null;
            try {
                body = JSON.parse(res.body);
            } catch (e) {
                callback("Error parsing result: " + e, null);
                return;
            }
            var urls = body.url;
            if (!urls) {
                callback("No urls returned", null);
                return;
            }

            // Different forms of the song title we want to look for
            var targets = [
                song.name + " " + song.artist,
                song.artist + " " + song.name,
                song.name
            ];
            var result = _.min(_.filter(urls, function(element) {
                var url = element[Object.keys(element)[0]];
                return ignore.indexOf(url) == -1;
            }), function(element) {
                return _.reduce(

                    // Get distance from each target string
                    targets.map(function(target) {
                        return new Levenshtein(target, Object.keys(element)[0]).distance;
                    }),

                    // Add them up
                    function(memo, num) {
                        return memo + num;
                    },

                    // Demote non-mp3s down
                    (!!element[Object.keys(element)[0]].match(/\.mp3$/) ? 0 : 20)
                );
            });
            if (result == Infinity) {
                callback("No results", null)
            } else {
                var songURL = result[Object.keys(result)[0]];
                callback(null,songURL);
            }
        });
    });
    return muzik;
}
