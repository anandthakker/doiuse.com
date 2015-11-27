var through = require('through2')

// limit - stream filter to limit input and fire a callback when reached.
// onLimit(bytesSoFar, lastChunk): return a value > current limit to keep going.
// Otherwise, error and ends the stream.
module.exports = function limit (size, onLimit) {
  var soFar = 0

  size = through.obj()
  var lim = through(function (chunk, enc, next) {
    soFar += chunk.length
    if (soFar > size && !(size = onLimit(soFar, chunk))) {
      next(new Error('Limit reached.'))
    } else {
      next(null, chunk)
    }
  },
    function end (next) {
      this.push(null)
      size.end('' + soFar)
      next()
    })

  lim.size = size

  return lim
}
