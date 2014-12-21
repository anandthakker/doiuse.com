
/* start and end are {line, column}  */
module.exports = function(text, start, end) {
  var s = indexOf(text, start.line);
  var e = indexOf(text, end.line+1);
  if(s >= 0 && e >= 0) return text.slice(s, e);
  else if(s >= 0 && e < 0) return text.slice(s);
  else return '';
}


function indexOf(str, line) {
  for(var i = 0; i < str.length; i++) {
    if(line === 1) return i;
    if(line < 1) return -1;
    if(str.charAt(i) === '\n') line--;
  }
  return -1;
}
