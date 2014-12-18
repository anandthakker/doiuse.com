var fs = require('fs'),
    path = require('path');

module.exports = log;

// some ad-hoc memory data.
var last = 0;

function log() {
  if (Date.now() - last < 60000) return; // once per hour
  last = Date.now();
  
  data = {
    timestamp: last,
    memory: process.memoryUsage()
  }
  
  var logfile = path.join(__dirname, '../public/log/memory.ldjson');
  fs.appendFile(logfile, JSON.stringify(data) + '\n', { flag: 'a+'},
  function(err) {
    if(err) { console.error(err); }
  });
}
