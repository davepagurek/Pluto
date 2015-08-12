var request = require('popsicle');
module.exports = {
  getLinks : function (song,callback){
    request('http://muzik.elasticbeanstalk.com/search?songname='+song.name,function(res){
      var urls = res.body.url;
      var firstResult = urls[0];
      var url = firstResult[Object.keys(firstResult)[0]];
      console.log(url);
      callback(url);
    });
  }
}
