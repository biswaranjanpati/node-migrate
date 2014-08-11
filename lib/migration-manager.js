var util = require('util');

function MigrationManager() {
  this.migrations = [];
  this.completedMigrations = [];
  this.newMigrations = [];
  this.jobList = [];
};

util.inherits(MigrationManager, require('events').EventEmitter);


//
// Public
//
MigrationManager.prototype.migrate = function(direction, count, callback) {
  if (arguments.length == 2) {
    callback = count;
    count = Infinity;
  } else if (arguments.length < 2 || arguments.length > 3) {
    throw new Error('MigrationManager.migrate(direction, [count,] callback) requires at least two arguments.')
  }

  var self = this;
  this._load(function(err) {
    if (err) return callback(err);
    return self._migrate(direction, count, callback);
  });
};


['up', 'down'].forEach(function(method) {
  MigrationManager.prototype[method] = function(count, callback) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(method);
    this.migrate.apply(this, args);
  }
});


//
// Interface for Modules
//
var notImplementedError = function(name) {
  throw new Error('MigrationManager.'+name+' is not implemented.');
};


MigrationManager.prototype.compareMigration = function(mig1, mig2) {
  notImplementedError('compareMigration');
};


MigrationManager.prototype.filterNewMigrations = function() {
  notImplementedError('filterNewMigrations');
};


MigrationManager.prototype.loadAllMigrations = function(callback) {
  notImplementedError('loadAllMigrations');
};


MigrationManager.prototype.loadCompletedMigrations = function(callback) {
  notImplementedError('loadCompletedMigrations');
};


MigrationManager.prototype.save = function(migration, callback) {
  notImplementedError('save');
};


MigrationManager.prototype.delete = function(migration, callback) {
  notImplementedError('delete');
};


MigrationManager.prototype.executeMigration = function(direction, migration, callback) {
  notImplementedError('executeMigration');
};


//
// API for Modules (besides all the functions above)
//
MigrationManager.prototype.addMigration = function(migration) {
  this.migrations.push(migration);
};


MigrationManager.prototype.addCompletedMigration = function(migration) {
  this.completedMigrations.push(migration);
};


MigrationManager.prototype.addNewMigration = function(migration) {
  this.newMigrations.push(migration);
};


MigrationManager.prototype.execute = function(direction, callback) {
  var self = this;
  if (!this.jobList.length) return callback();
  migration = this.jobList.shift();
  this.executeMigration(direction, migration, function(err) {
    if (err) return callback(err);
    self[direction == 'up'? 'save': 'delete'](function(err) {
      if (err) return callback(err);
      self
        ._shiftStack(direction)
        .execute(direction, callback);
    })
  });
};


//
// Private
//
MigrationManager.prototype._load = function(callback) {
  var self = this;
  this._loadAllMigrations(function(err) {
    if (err) return callback(err);
    self._loadCompletedMigrations(function(err) {
      if (err) return callback(err);
      self.filterNewMigrations();
      callback();
    });
  });
};


MigrationManager.prototype._loadAllMigrations = function(callback) {
  var self = this;
  this.loadAllMigrations(function(err, migrations) {
    if (err) return callback(err);
    for (var i=0; i < (migrations||[]).length; ++i) {
      self.addMigration(migrations[i]);
    };
    callback(null);
  });
};


MigrationManager.prototype._loadCompletedMigrations = function(callback) {
  var self = this;
  this.loadCompletedMigrations(function(err, migrations) {
    if (err) return callback(err);
    for (var i=0; i < (migrations||[]).length; ++i) {
      self.addCompletedMigration(migrations[i]);
    };
    callback(null);
  });
};


MigrationManager.prototype._migrate = function(direction, count, callback) {
  var list = direction == 'up'? this.newMigrations : this.completedMigrations.reverse();
  this.jobList = list.slice(0, count || Infinity);
  this.execute(direction, callback);
};


MigrationManager.prototype._shiftStack = function(direction) {
  if (direction == 'up') {
    this.completedMigrations.push(this.newMigrations.shift());
  } else {
    this.newMigrations.unshift(this.completedMigrations.pop());
  }
  return this;
};


module.exports = MigrationManager;
