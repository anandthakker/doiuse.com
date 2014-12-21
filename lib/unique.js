
var through = require('through2');

module.exports = function unique() {
  var used = {};
  return through.obj(function(usage, enc, next) {
    if(usage.feature && used[usage.feature]) return next();
    if(usage.feature) used[usage.feature] = true;
    next(null, usage);
  })
}
