module.exports = function(pluto){
  var trelloModule = {};
  pluto.get("/board",function(req,res){
    res.render("trello.html",{
        "layout":false
    });
  });
  return trelloModule;
}
