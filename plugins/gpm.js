module.exports = function(pluto) {
  var spawn = require( 'child_process' ).spawn;

  var gpm = {};
  
  gpm.proxy = function() {
    gpm.proxyProcess = gpm.proxyProcess || spawn('GMusicProxy', ['--config', 'gmusicproxy.cfg']);
    return gpm.proxyProcess;
  };

  gpm.killProxy = function() {
    if (gpm.proxyProcess) {
      gpm.proxyProcess.stdin.pause();
      gpm.proxyProcess.kill();
    }
  };

  gpm.addURLTo = function(data, song) {
      data.url = 'http://localhost:9999/get_by_search?type=song' +
          "&artist=" + encodeURIComponent(song.artist) +
          "&title=" + encodeURIComponent(song.name);
      data.streaming = true;
      return song;
  };

  gpm.proxy();

  return gpm;
};
