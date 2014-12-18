
var http = require('http');
var qs = require('querystring');
var concat = require('concat-stream');
var through = require('through2');
var styles = require('style-stream');
var doiuse = require('doiuse/stream');
var defaultBrowsers = require('doiuse').default;
var ecstatic = require('ecstatic');


var stat = ecstatic({ root: __dirname + '/public' });

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
    req
    .pipe(limit(1e6, function(){request.connection.destroy()}))
    .pipe(concat(function(data) {
      try {
        var body = JSON.parse(data);
        
        if(body.browsers.trim().length === 0) body.browsers = defaultBrowsers;
        var doi = doiuse(body.browsers, {json: true})
        doi.pipe(through.obj(pruneFeatureUsage))
        .pipe(res);
        
        if(body.url) {
          styles({url: body.url}).pipe(doi);
        } else if(body.css) {
          doi.end(body.css)
        }
      } catch(e) {
        console.error(e);
        res.statusCode = 500;
        res.end('Error');
      }
    }));
  }
  else {
    stat(req, res);
  }
})

var port = process.env.PORT || Number(process.argv[2]) || 3000;
server.listen(port, function() {
  console.log('doiuse:', 'listening on ',port);
});


// 
function pruneFeatureUsage(usageInfo, enc, next) {
  if(usageInfo && usageInfo.featureData) delete usageInfo.featureData.caniuseData.stats
  next(null, JSON.stringify(usageInfo) + '\n');
}

// limit - request stream filter to limit input and fire a callback when reached.
// onLimit(bytesSoFar, lastChunk): return a value > current limit to keep going.
// Otherwise, error and ends the stream.
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
