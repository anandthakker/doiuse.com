var JSONStream = require('JSONStream')
var pipe = require('mississippi').pipe
var through = require('mississippi').through
var fromString = require('from2-string')
var styles = require('style-stream')
var next = require('next-stream')
var doiuse = require('doiuse/stream')
var defaultBrowsers = require('doiuse').default

var prune = require('./prune')
var unique = require('./unique')
var limitstream = require('./limit')

/*
* options must have either `url` or `css`.
*/
module.exports = function cssFeatures (args, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  var url = args.url || ''
  var css = args.css || ''
  var browsers = args.browsers || ''

  if (browsers.trim().length === 0) browsers = defaultBrowsers

  var streams
  if (url.trim().length > 0) {
    streams = [styles({url: url})]
  } else {
    streams = [fromString(css)]
    // hacky html content check: look for '<' before anything else.
    if (/^[\s]*</.test(css)) {
      streams.push(styles({ basepath: false }))
    }
  }

  if (args.rawCss) {
    streams.push(res)
    pipe(streams, function (err) {
      if (err) { console.error(err) }
    })
    return
  }

  var errorsAndWarnings = []
  var uniq = unique()
  var limit = limitstream(1e6)
  var features = prune()
  streams = streams.concat([
    limit,
    doiuse({ browsers: browsers, skipErrors: true }, url.trim().length ? url : 'pasted content')
      .on('warning', function (warn) { errorsAndWarnings.push(warn) }),
    uniq.features,
    features
  ])
  var stringify = features.pipe(JSONStream.stringify())
  var error = through()
  pipe(streams, function (err) {
    if (err) {
      console.error('Error processing CSS', err)
      console.trace()
      if (!limit.ended) { limit.end() }
      if (!uniq.ended) { uniq.features.end() }
      stringify.end()
      if (JSON.stringify(err) === '{}') { err = err.toString() }
      errorsAndWarnings.push(err)
    }
    error.end(', "errors":' + JSON.stringify(errorsAndWarnings))
  })

  // construct JSON output stream
  pipe(next(['{ "args":', JSON.stringify(args), ',',
    '"usages": ', stringify.pipe(through()), ',',
    '"counts": ', uniq.counts, ',',
    '"size": ', limit.size,
    error,
    '}'
  ], { open: false }), res, function (err) {
    if (err) { console.error(err) }
    res.end()
  })
}
