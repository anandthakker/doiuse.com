
var through = require('through2');
var debug = require('debug')('doiuse:prune');

var slice = require('./source-slice');

module.exports = function() { return through.obj(pruneFeatureUsage); }

function pruneFeatureUsage(usageInfo, enc, next) {
  usageInfo.featureData = usageInfo.featureData || {}
  
  var source = usageInfo.usage && usageInfo.usage.source;
  if(source && source.content)
    var s = slice(source.content, source.start, source.end).trim();
    if(s.trim().length > 0) source.content = s;
  else
    source = false

  var missing = usageInfo.featureData.missing.match(/[^\(]*\([^\)]*\),?/g)
  if(missing)
    missing = missing.map(function(s) {
      var v = s.indexOf('(')
      return {
        browser: s.slice(0,v),
        versions: s.slice(v)
      }
    });

  var data = {
    message: usageInfo.message,
    error: usageInfo.error,
    feature: usageInfo.feature,
    title: usageInfo.featureData.title,
    missing: missing,
    source: source
  }
  debug('usage', data);
  next(null, data);
}
