
var styles = require('style-stream'),
  doiuse = require('doiuse/stream'),
  defaultBrowsers = require('doiuse').default,
  limit = require('./limit');
  
var debug = require('debug')('doiuse:css-features');

/*
* options must have either `url` or `css`.
*/
module.exports = function cssFeatureStream(options) {
  if (!options.browsers || (options.browsers.trim().length === 0))
    options.browsers = defaultBrowsers;

  var doi = doiuse(options.browsers, {
    json: true
  })

  if (options.url && options.url.trim().length > 0) {
    debug('from url', options.url)
    styles({url: options.url})
      .pipe(limit(1e6))
      .pipe(doi);
  } else {
    var input = options.css || ''
    debug('from pasted code', input.length)
      // hacky html vs css test
    if (/^[\s]*</.test(input)) {
      var style = styles({basepath: '/dev/null'});
      style.pipe(doi);
      style.end(input);
    } else doi.end(input)
  }

  return doi;
}
