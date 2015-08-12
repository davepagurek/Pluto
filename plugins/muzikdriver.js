var request = require('popsicle');
module.exports = {
  getLink : function (song,callback){
    request('http://muzik.elasticbeanstalk.com/search?songname='+ song.name.shellEscape() + " " + song.artist.shellEscape())
    .then(function(res){
      var body = JSON.parse(res.body);
      var urls = body.url;
      var firstResult = urls[0];
      var url = firstResult[Object.keys(firstResult)[0]];
      callback(Object.keys(firstResult)[0],url);
    });
  }
}
