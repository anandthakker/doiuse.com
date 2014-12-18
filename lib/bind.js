
module.exports = bind

function bind(object, name, property, cb) {
  if(typeof property === 'undefined') { property = name; }
  if(typeof cb === 'undefined') {
    cb = property;
    property = name;
  }
  
  if(Array.isArray(name)) {
    name.forEach(function(name) { bind(object,name,cb); });
  }
  else {
    var el = document.querySelector('[name="'+name+'"]');
    el.addEventListener('keyup', update.bind(null, cb));
    update();
    function update(cb) {
      object[property] = el.value;
      if(typeof cb === 'function') { cb(el, el.value, property); }
    }
  }
}
