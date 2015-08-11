var request = require('request');
module.exports = function (songname,callback){
  request('http://muzik.elasticbeanstalk.com/search?songname='+songname,function(error,response,body){
    callback(body);
  });
};

