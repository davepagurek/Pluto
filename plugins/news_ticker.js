module.exports = function(pluto) {
  require("shelljs/global");
  var request = require('popsicle');
  var path = require("path");
  var fs = require('fs');

  //var data = pluto.getStorage("news");

  var newsModule = {};

  var NewsResult = function (title, content, url, image){
    this.title = title;
    this.content = content;
    this.url = url;
    this.image = image;
    this.printData = function(){
      console.log(this.title)
    };
  }
  function getResults(query, callback){
    var resultsArray = [];
    var baseURL= 'https://ajax.googleapis.com/ajax/services/search/news?v=1.0&q='+encodeURIComponent(query);
    request(baseURL).then(function(res){
      if(res.status == 200){
        var body = JSON.parse(res.body);
        for (var x in body.responseData.results){
          var result = body.responseData.results[x];
          var tempResult = new NewsResult(decodeURIComponent(result.titleNoFormatting), result.content, decodeURIComponent(result.url),result.image.url);
          resultsArray.push(tempResult);
        }
      }
      callback(resultsArray);
    });
  }

  pluto.get("/news/:topic", function(req,res){
    getResults(req.params.topic,function(data){
      res.render("display.html",{
        layout:false,
        news:data
      });
    });
  });
  return newsModule;
}
