var ldjson = require('ldjson-stream')
var styles = require('style-stream')
var next = require('next-stream')
var doiuse = require('doiuse/stream')
var defaultBrowsers = require('doiuse').default

var prune = require('./prune')
var unique = require('./unique')
var jsonarray = require('./jsonarray')
var limitstream = require('./limit')

var debug = require('debug')('doiuse:css-features')

/*
* options must have either `url` or `css`.
*/
module.exports = function cssFeatures (args) {
  var url = args.url || ''
  var css = args.css || ''
  var browsers = args.browsers || ''

  if (browsers.trim().length === 0) browsers = defaultBrowsers

  var uniq = unique()
  var limit = limitstream(1e6)
  var features = limit
    .pipe(doiuse(browsers, { json: true }))
    .pipe(uniq.features)
    .pipe(prune())
    .pipe(ldjson.serialize())
    .pipe(jsonarray())

  // pipe in the CSS
  if (url.trim().length > 0) {
    debug('from url', url)
    styles({url: url}).pipe(limit)
  } else if (/^[\s]*</.test(css)) {
    // hacky html content check: look for '<' before anything else.
    debug('from pasted html', css.length)
    var style = styles({basepath: '/dev/null'})
    style.pipe(limit)
    style.end(css)
  } else {
    debug('from pasted css', css.length)
    limit.end(css)
  }

  // construct JSON output stream
  return next(['{ "args":', JSON.stringify(args), ',',
    '"counts":', uniq.counts, ',',
    '"size":', limit.size, ',',
    '"usages":', features,
    '}'
  ], {
    open: false
  })
}
