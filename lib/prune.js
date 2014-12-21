
var through = require('through2');
var debug = require('debug')('doiuse:prune');

var slice = require('./source-slice');

module.exports = function() { return through.obj(pruneFeatureUsage); }

function pruneFeatureUsage(usageInfo, enc, next) {
  usageInfo.featureData = usageInfo.featureData || {}
  
  var source = usageInfo.usage && usageInfo.usage.source;
  if(source && source.content)
    source.content = slice(source.content, source.start, source.end).trim();
  else
    source = false

  var data = {
    message: usageInfo.message,
    error: usageInfo.error,
    feature: usageInfo.feature,
    title: usageInfo.featureData.title,
    missing: usageInfo.featureData.missing,
    source: source
  }
  debug('usage', data);
  next(null, data);
}
