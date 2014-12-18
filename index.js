
var fs = require('fs');
var http = require('http');
var qs = require('querystring');
var concat = require('concat-stream');
var through = require('through2');
var styles = require('style-stream');
var doiuse = require('doiuse/stream');
var defaultBrowsers = require('doiuse').default;
var trumpet = require('trumpet');
var ecstatic = require('ecstatic');

var render = require('./lib/render');
var logmem = require('./lib/logmem');

var stat = ecstatic({root: __dirname + '/public',gzip: true});


var server = http.createServer(function(req, res) {
  logmem();
  // Query for browser support analysis:
  // POST / { "browsers": ["ie >= 8","last 2 versions"], "url":"http://caniuse.com" }
  // or
  // POST / { "browsers": ["ie >= 8","last 2 versions"], "css":"a { transition: 1s all; }" }
  //
  // Response is ld-json unsupported feature usage data, as provided by doiuse.
  
  if (req.method == 'POST') {
    req
    .pipe(limit(1e6, function(){request.connection.destroy()}))
    .pipe(concat(function(data) {
      try {
        var body = JSON.parse(data);
        doiuseStream(body, res)
          .pipe(through.obj(pruneFeatureUsage))
          .pipe(res);
        
      } catch(e) {
        console.error(e);
        res.statusCode = 500;
        res.end('Error');
      }
    }));
  }
  else if(/^\/(\?.*)$/.test(req.url)) {
    var args = qs.parse(req.url.split('?').splice(1).join('?'));
    var index = trumpet();
    
    if(args.url) {
      // prerender results.
      doiuseStream(args)
        .pipe(through.obj(renderDoiuseResult))
        .pipe(index.select('.results').createWriteStream());
    }
    
    fs.createReadStream(__dirname + '/public/index.html')
    .pipe(index)
    .pipe(res);
  }
  else {
    stat(req, res);
  }
})

var port = process.env.PORT || Number(process.argv[2]) || 3000;
server.listen(port, function() {
  console.log('doiuse:', 'listening on ',port);
});


function doiuseStream(options) {
  if(!options.browsers || (options.browsers.trim().length === 0))
    options.browsers = defaultBrowsers;

  var doi = doiuse(options.browsers, {json: true})
  
  if(options.url && options.url.trim().length > 0) {
    styles({url: options.url}).pipe(doi);
  } else {
    var input = options.css || ''
    // hacky html vs css test
    if(/^[\s]*</.test(input)) {
      console.log('HTML input');
      var style = styles({basepath: '/dev/null'});
      style.pipe(doi);
      style.end(input);
    }
    else doi.end(input)
  }
  
  return doi;
}


function renderDoiuseResult(usageInfo, enc, next) {
  next(null, render(usageInfo));
}

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
