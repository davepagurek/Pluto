//module.exports = function(pluto) {
  require("shelljs/global");
  var request = require('popsicle');
  var newsResult = function (title, content, url, image){
    this.title = title;
    this.content = content;
    this.url = url;
    this.image = image;
  }
  var resultsArray = [];
  function getResults(query){
    var baseURL= 'https://ajax.googleapis.com/ajax/services/search/news?v=1.0&q='+encodeURIComponent(query);
    request(baseURL).then(function(res){
      if(res.status == 200){
        var body = JSON.parse(res.body);
        for (var x in body.responseData.results){
          var result = body.responseData.results[x];
          resultsArray.push(new newsResult(result.titleNoFormatting, result.content, result.url,result.image.url));
        }
        debugger;
      }
    });
  }
//}
  getResults("tesla");
