
var fs = require('fs');
var http = require('http');
var qs = require('querystring');
var concat = require('concat-stream');
var through = require('through2');
var trumpet = require('trumpet');
var ldjson = require('ldjson-stream');
var ecstatic = require('ecstatic');

var debug = require('debug')('doiuse:server');
var logmem = require('./lib/logmem');

var prune = require('./lib/prune'),
    unique = require('./lib/unique'),
    limit = require('./lib/limit'),
    cssFeatures = require('./lib/css-features'),
    render = require('./lib/render');



var stat = ecstatic({root: __dirname + '/public',gzip: true});

var server = http.createServer(function(req, res) {
  logmem();
  debug(req.method, req.url);

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
        cssFeatures(JSON.parse(data))
          .pipe(unique())
          .pipe(prune())
          .pipe(ldjson.serialize())
          .pipe(res);
        
      } catch(e) {
        console.error(e);
        res.statusCode = 500;
        res.end('Error');
      }
    }));
  }
  else if(/^\/?((\?.*)|$)/.test(req.url)) {
    var args = qs.parse(req.url.split('?').splice(1).join('?'));
    var index = trumpet();
    
    if(args.url) {
      // prerender results.
      cssFeatures(args)
        .pipe(unique())
        .pipe(prune())
        .pipe(through.obj(function (usageInfo, enc, next) {
          next(null, render(usageInfo));}))
        .pipe(index.select('#results').createWriteStream());
    }
    
    // inline styles to avoid flash of unstyled content.
    fs.createReadStream(__dirname + '/public/main.css')
      .pipe(index.select('#anti-fouc').createWriteStream());

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
