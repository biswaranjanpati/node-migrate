var fs = require('fs');
var path = require('path');
var Migration = require('./migration');


function MigrationManager(opt) {
  if (typeof opt != 'object') opt = {}
  this.directory = path.resolve(opt.directory) || path.resolve('migrations');
  this.migrations = [];
  this.completedMigrations = [];
  this.newMigrations = [];
  this.jobList = [];
}


//
// Public
//
MigrationManager.prototype.migrate = function(direction, callback) {
  if (arguments.length == 1) {
    callback = direction;
  }
  var self = this;
  callback = callback || function(){};
  this._load(function(err) {
    if (err) return callback(err);
    return _migrate(direction, callback);
  });
}


MigrationManager.prototype.oneUp = function(callback) {
  var self = this;
  this._load(function(err){
    if (err) return callback(err);
    this.jobList.push(this.newMigrations[0]);
    this._execute('up', callback)
  });
}


MigrationManager.prototype.oneDown = function(callback) {
  var self = this;
  this._load(function(err){
    if (err) return callback(err);
    this.jobList.push(migration);
    this._execute('down', callback)
  });
}


//
// Interface
//
var notImplementedError = function(name) {
  throw new Error('MigrationManager.%s is not implemented.', name);
}

MigrationManager.prototype.compareMigration = function(mig1, mig2) {
  notImplementedError('compareMigration');
}


MigrationManager.prototype.filterNewMigrations = function() {
  notImplementedError('filterNewMigrations');
}


MigrationManager.prototype.loadAllMigrations = function(callback) {
  notImplementedError('loadAllMigrations');
}


MigrationManager.prototype.loadCompletedMigrations = function(callback) {
  notImplementedError('loadCompletedMigrations');
}


MigrationManager.prototype.save = function(migration, callback) {
  notImplementedError('save');
}


MigrationManager.prototype.delete = function(migration, callback) {
  notImplementedError('delete');
}


//
// Private
//
MigrationManager.prototype._migrate = function(direction, callback) {
  this.jobList = direction == 'up'? this.newMigrations : this.completedMigrations.reverse();
  this._execute(direction, callback);
}


MigrationManager.prototype._load = function(callback) {
  var self = this;
  this._loadAllMigrations(function(err, migrations) {
    if (err) return callback(err);
    self._loadCompletedMigrations(function(err, completedMigrations) {
      if (err) return callback(err);
      self.filterNewMigrations();
      callback();
    });
  });
}


MigrationManager.prototype._loadAllMigrations = function(callback) {
  var self = this;
  this.loadAllMigrations(function(err, migrations) {
    if (err) return callback(err);
    for (var i=0; i < (migrations||[]).length; ++i) {
      var migration = new Migration(migrations[i], self)
      self.migrations.push(migration);
    };
    callback(null, self.migrations);
  });
}


MigrationManager.prototype._loadCompletedMigrations = function(callback) {
  var self = this;
  this.loadCompletedMigrations(function(err, migrations) {
    if (err) return callback(err);
    for (var i=0; i < (migrations||[]).length; ++i) {
      self.completedMigrations.push(migrations[i]);
    };
    callback(null, self.completedMigrations);
  });
}


MigrationManager.prototype._shiftStack = function(direction) {
  if (direction == 'up') {
    this.completedMigrations.push(this.newMigrations.shift());
  } else {
    this.newMigrations.unshift(this.completedMigrations.pop());
  }
  return this;
}


MigrationManager.prototype._execute = function(direction, callback) {
  var self = this;
  if (!this.jobList.length) return callback();
  migration = this.jobList.shift();
  migration.execute(direction, function(err) {
    if (err) return callback(err);
    self[direction == 'up'? 'save': 'delete'](function(err) {
      if (err) return callback(err);
      self
        ._shiftStack(direction)
        ._execute(direction, callback);
    })
  });
}

module.exports = MigrationManager;
