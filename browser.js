var xhr = require('xhr');
var render = require('./lib/render');

module.exports = {
  bindElement: require('./lib/bind'),
  process: processCss
}

function processCss(options, cb) {
  xhr({
    body: JSON.stringify(options),
    method: 'POST',
    uri: '/',
    headers: { 'Content-Type': 'application/json' }
  },
  function(err, resp, body) {
    if(err) return cb(err);
    else if(!(resp.statusCode >= 200 && resp.statusCode < 400))
      return cb(new Error('There was an error, and this should be reported gracefully.')); // TODO!
    var result = (!body) ? '' : body
      .trim()
      .split('\n')
      .map(function(s) { return JSON.parse(s); })
      .map(render)
      .join('');
    
    cb(null, {
      results: result,
      options: options
    });
  });
}
