
var mustache = require('mustache');
var fs = require('fs');

module.exports = render;

var template = fs.readFileSync(__dirname + '/usage.tpl.html', 'utf8');
function render(usage) { return mustache.render(template, usage); }
