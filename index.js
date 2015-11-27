var fs = require('fs')
var http = require('http')
var qs = require('querystring')
var url = require('url')
var concat = require('concat-stream')
var trumpet = require('trumpet')
var ecstatic = require('ecstatic')

var debug = require('debug')('doiuse:server')

var limit = require('./lib/limit')
var cssFeatures = require('./lib/css-features')

var stat = ecstatic({root: __dirname + '/public', gzip: true})

var server = http.createServer(function (req, res) {
  debug(req.method, req.url)

  // POST /
  // arguments (either query string or POST body) should have either `url` xor
  // `css` property, and optional `browsers`.
  // response is {args: {given args}, usages: [usages of queried features], count:{feature:count}}
  if (req.method === 'POST') {
    req
      .pipe(limit(1e6, function () { req.connection.destroy() }))
      .pipe(concat(function (args) {
        try {
          args = JSON.parse(args)
          cssFeatures(args)
            .pipe(res)
        } catch (e) {
          debug('Error processing POST', args, e)
          res.statusCode = 400
          res.end()
        }
      }))
  } else if (/^\/api/.test(req.url)) {
    // GET /api?..., same args and response as POST /.
    var args = qs.parse(url.parse(req.url).query)
    res.setHeader('Content-Type', 'application/json')
    cssFeatures(args).pipe(res)
  } else if (/^\/?((\?.*)|$)/.test(req.url)) {
    var index = trumpet()
    // inline styles to avoid flash of unstyled content.
    fs.createReadStream(__dirname + '/public/main.css')
      .pipe(index.select('#anti-fouc').createWriteStream())

    fs.createReadStream(__dirname + '/public/index.html')
      .pipe(index)
      .pipe(res)
  } else {
    stat(req, res)
  }
})

var port = process.env.PORT || Number(process.argv[2]) || 3000
server.listen(port, function () {
  console.log('doiuse:', 'listening on ', port)
})
