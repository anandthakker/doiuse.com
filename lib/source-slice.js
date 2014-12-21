
var debug = require('debug')('doiuse:source-slice');

/* start and end are {line, column}  */
module.exports = function(text, start, end) {
  var s = index(text, start.line, start.column);
  var e = index(text, end.line, end.column);
  debug(start, s)
  debug(end, e)
  if(s >= 0 && e >= 0) return text.slice(s, e);
  else if(s >= 0 && e < 0) return text.slice(s);
  else return '';
}


function index(str, line, col) {
  for(var i = 0; i < str.length; i++) {
    if(line === 1) break;
    if(line < 1) return -1;
    if(str.charAt(i) === '\n') line--;
  }
  console.log(i);
  return i + col - 1;
  return -1;
}
