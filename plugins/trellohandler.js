module.exports = function(pluto){
  var trelloModule = {};
  pluto.get("/board",function(req,res){
    res.redirect("https://trello.com/b/VgNPAYxd");
  });
  return trelloModule;
}
