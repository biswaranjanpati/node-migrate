function Migration(obj, parent) {
  if (typeof obj.name != 'string') throw new Error('A migration must have a string as name');
  this.set(obj);
  this.title = obj.title || this.humanize(obj.name);
  Object.defineProperty(this, 'parent', {value: parent});
}


Migration.prototype.set = function(obj) {
  for (key in obj) {
    var value = obj[key];
    if (typeof value != 'undefined') this[key] = value;
  }
  return this;
}


Migration.prototype.humanize = function(name) {
  return name.substring(1)
    .replace(/(^([0-9]*)\-|\.[a-z]{2,5}$)/g, '')
    .replace(/([a-z])(?=[A-Z])/g, "$1 ");
}


Migration.prototype.load = function(callback) {
  if (this.up || this.down) return callback();
  var migration;
  try {
    migration = require(this.path);
  } catch (err) {
    return callback(err);
  }
  this.up = migration.up;
  this.down = migration.down;
  callback();
}


Migration.prototype.execute = function(direction, callback) {
  var self = this;
  this.load(function(err) {
    if (err) return callback(err);
    var payload = self.parent;
    payload.current = self;
    self[direction] && self[direction].call(payload, callback);
  })
}

module.exports = Migration;
