var util = require('util');
var Migration = require('./migration')

function FileStorageMigration(opt){
  if (typeof opt != 'object') opt = {};
  this.directory = opt.directory || path.resolve('migrations');
  this.db = opt.db;
  this.constructor.super_.call(this);
};

util.inherits(FileStorageMigration, require('./migration-manager'));


FileStorageMigration.prototype.compareMigration = function(mig1, mig2) {
  mig1.name == mig2.name;
};


FileStorageMigration.prototype.filterNewMigrations = function() {
  var completedKeys = [];
  for (var i=0; i < this.completedMigrations.length; ++i) {
    completedKeys.push(this.completedMigrations[i].name);
  };
  return this.newMigrations = this.migrations.filter(function(migration) {
    return completedKeys.indexOf(migration.name) == -1;
  });
};


FileStorageMigration.prototype.sortMigrations = function() {
  var self = this;
  ['migrations', 'completedMigrations', 'newMigrations'].forEach(function(type) {
    self[type].sort(function(a, b){
      if(a.name > b.name) return 1;
      if(a.name < b.name) return -1;
      throw new Error('There are two migrations using the same name: '+a.name)
    });
  });
};


FileStorageMigration.prototype.loadAllMigrations = function(callback) {
  var self = this;
  migrationFiles = fs.readdirSync(this.directory).filter(function(file){
    return file.match(/^\d+.*\.(js|((lit)?coffee|coffee\.md))$/);
  }).sort();

  var migrations = [];
  for (var i=0; i < migrationFiles.length; ++i) {
    var migration = migrationFiles[i];
    migration = new Migration({
      name: migration,
      path: path.join(self.directory, migration)
    });
    migrations.push(migration);
  };
  callback(null, migrations);
};


var readJson = function(file, callback) {
  fs.readFile(file, 'utf8', function(err, json){
    if (err && err.code != 'ENOENT') return callback(err);
    else if (err) return callback(err);
    try {
      json = JSON.parse(json || '[]');
    } catch (err) {
      return callback(err);
    }
    callback(null, json);
  });
};


FileStorageMigration.prototype.loadCompletedMigrations = function(callback) {
  readJson(this.directory+'/.migrate', function(err, arr){
    if (err) return callback(err);
    var migrations = [];
    for (var i=0; i < arr.length; ++i) {
      var migration = arr[i];
      migration = new Migration({
        name: migration.name,
        path: path.join(self.directory, migration.name)
      });
      migrations.push(migration);
    };
  });
};


var populateMigration = function(migration, callback) {
  try {
    migrationFile = require(migration.path);
  } catch (err) {
    return callback(err);
  }
  migration.up = migrationFile.up;
  migration.down = migrationFile.down;
  callback(null, migration);
};


FileStorageMigration.prototype.executeMigration = function(direction, migration, callback) {
  var self = this;
  populateMigration(migration, function(err, migration) {
    if (err) return callback(err);
    self.current = migration;
    migration[direction] && migration[direction].call(self, callback);
  })
};


FileStorageMigration.prototype.save = function(migration, callback) {
  var self = this;
  readJson(this.directory+'/.migrate', function(err, json){
    if (err) return callback(err);
    json.push({name: migration.name});
    fs.writeFile(this.directory+'/.migrate', JSON.stringify(json), callback)
  });
};


FileStorageMigration.prototype.delete = function(migration, callback) {
  var self = this;
  readJson(this.directory+'/.migrate', function(err, json){
    if (err) return callback(err);
    json = json.filter(function (mig) {
      return !self.compareMigration(mig, migration);
    });
    fs.writeFile(this.directory+'/.migrate', JSON.stringify(json), callback)
  });
};

module.exports = FileStorageMigration;
