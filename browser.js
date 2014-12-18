var xhr = require('xhr');
var mustache = require('mustache');
var fs = require('fs');

module.exports = {
  bindElement: require('./lib/bind'),
  process: processCss
}

var template = fs.readFileSync('./lib/usage.tpl.html', 'utf8');
function processCss(options, cb) {
  xhr({
    body: JSON.stringify(options),
    method: 'POST',
    uri: '/',
    headers: { 'Content-Type': 'application/json' }
  },
  function(err, resp, body) {
    if(err || !(resp.statusCode >= 200 && resp.statusCode < 400)) {
      return cb(err, resp);
    }
    console.log(resp);
    console.log(template);
    cb(null, body
      .trim()
      .split('\n')
      .map(function(s) { return JSON.parse(s); })
      .map(function(usage) { return mustache.render(template, usage); } )
      .join('')
    );
  });
}
