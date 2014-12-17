
var http = require('http');
var qs = require('querystring');
var concat = require('concat-stream');
var through = require('through2');
var styles = require('style-stream');
var doiuse = require('doiuse/stream');

var server = http.createServer(function(req, res) {
  
  // Query for browser support analysis:
  //
  // POST { "browsers": ["ie >= 8","last 2 versions"], "url":"http://caniuse.com" }
  // or
  // POST { "browsers": ["ie >= 8","last 2 versions"], "css":"a { transition: 1s all; }" }
  //
  // Response is ld-json unsupported feature usage data, as provided by doiuse.
  //
  if (req.method == 'POST') {
    req.pipe(limit(1e6, function(){request.connection.destroy()}))
    .pipe(concat({encoding: 'string'}, function(data) {
      var body = JSON.parse(data);
      
      var doi = doiuse(body.browsers, {json: true})
      doi.pipe(through.obj(pruneFeatureUsage))
        .pipe(res);

      if(body.url) {
        styles({url: body.url}).pipe(output);
      } else if(body.css) {
        doi.end(body.css)
      }
    }));
  }
})

server.listen(process.env.PORT || Number(process.argv[2]) || 3000);



function pruneFeatureUsage(usageInfo, enc, next) {
  for(k in usageInfo) {
    console.log(k);
  }
  if(usageInfo && usageInfo.featureData) delete usageInfo.featureData.caniuseData.stats
  next(null, JSON.stringify(usageInfo));
}

/**
 * limit - limit input and fire a callback when reached.
 *  
 * @param  {number} size    max bytes to pass through. 
 * @param  {~} onLimit called when max is reached, with (bytesSoFar, lastChunk). Return a value > current limit to keep going.  Otherwise, errors and ends the stream.
 * @return {Stream}          
 */ 
function limit(size, onLimit) {  
  var soFar = 0;
  return through(function(chunk, enc, next) {
    soFar += chunk.length;
    if(soFar > size && !(size = onLimit(soFar, chunk)))
      next(new Error('Limit reached.'));
    else
      next(null, chunk);
  });
}
