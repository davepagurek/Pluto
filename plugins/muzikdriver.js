var request = require('popsicle');
var Levenshtein = require("levenshtein");
module.exports = {
    getLink: function (song,ignore,callback){
        request('http://muzik.elasticbeanstalk.com/search?songname='+ song.name + " " + song.artist)
        .then(function(res){
            var body = JSON.parse(res.body);
            var urls = body.url;
            var result = _.min(_.filter(urls, function(element) {
                var url = element[Object.keys(element)[0]];
                return !!url.match(/\.mp3$/) &&
                    ignore.indexOf(url) == -1;
            }), function(element) {
                return new Levenshtein(song.name, Object.keys(element)[0]).distance;
            });
            var url = result[Object.keys(result)[0]];
            callback(Object.keys(result)[0],url);
        });
    }
}
