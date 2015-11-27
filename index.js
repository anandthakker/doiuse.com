var http = require('http')
var qs = require('querystring')
var url = require('url')
var ecstatic = require('ecstatic')
var concat = require('mississippi').concat
var pipe = require('mississippi').pipe

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
    pipe(
      req,
      limit(1e6, function () { req.connection.destroy() }),
      concat(function (args) {
        try {
          args = JSON.parse(args)
        } catch (e) {
          debug('Error parsing request ', args, e)
          res.statusCode = 400
          res.end(JSON.stringify({
            error: e.toString(),
            statusCode: 400
          }))
        }
        cssFeatures(args, res)
      }),
      function (err) {
        if (err) { console.error(err) }
      }
    )
  } else if (/^\/api/.test(req.url)) {
    // GET /api?..., same args and response as POST /.
    var args = qs.parse(url.parse(req.url).query)
    cssFeatures(args, res)
  } else {
    stat(req, res)
  }
})

var port = process.env.PORT || Number(process.argv[2]) || 3000
server.listen(port, function () {
  console.log('doiuse:', 'listening on ', port)
})
