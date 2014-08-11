function Migration(obj) {
  if (typeof obj.name != 'string') throw new Error('A migration must have a string as name');
  this.set(obj);
  this.title = obj.title || this.humanize(obj.name);
};


Migration.prototype.set = function(obj) {
  for (key in obj) {
    var value = obj[key];
    if (typeof value != 'undefined') this[key] = value;
  }
  return this;
};


Migration.prototype.humanize = function(name) {
  return name.substring(1)
    .replace(/(^([0-9]*)\-|\.[a-z]{2,5}$)/g, '')
    .replace(/([a-z])(?=[A-Z])/g, "$1 ");
};


module.exports = Migration;
