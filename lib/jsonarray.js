
var through = require('through2'),
  debug = require('debug')('doiuse:jsonarray');

// transforms a ldjson stream into a json array
module.exports = function() {
  var prev = null;
  return through.obj(function(json, enc, next) {
    if(!prev) this.push('[');
    if(prev) this.push(prev + ',\n');
    debug(prev ? prev : 'BEGIN: ' + json);
    prev = /\n$/.test(json) ? json.slice(0,-1) : json;
    next();
  }, function end(next) {
    debug('END', prev)
    if(prev) this.push(prev + ']');
    this.push(null);
    next();
  })
}
