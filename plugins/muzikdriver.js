var request = require('request');
module.exports = {
  getLink : function (song,callback){
    request('http://muzik.elasticbeanstalk.com/search?songname='+song.name,function(error,response,body){
      var bodyObj = JSON.parse(body);
      var urls = bodyObj.url;
      var firstResult = urls[0];
      var url = firstResult[Object.keys(firstResult)[0]];
      console.log(url);
      callback(url);
    });
  }
}
