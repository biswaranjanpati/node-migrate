var util = require('util');

function FileStorageMigration(opt){
  if (typeof opt != 'object') opt = {};
  this.directory = opt.directory || path.resolve('migrations');
  this.db = opt.db;
  this.constructor.super_.call(this);
}
util.inherits(FileStorageMigration, require('./migration-manager'));


FileStorageMigration.prototype.compareMigration = function(mig1, mig2) {
  mig1.name == mig2.name;
}


FileStorageMigration.prototype.filterNewMigrations = function() {
  var completedKeys = [];
  for (var i=0; i < this.completedMigrations.length; ++i) {
    completedKeys.push(this.completedMigrations[i].name);
  };
  return this.newMigrations = this.migrations.filter(function(migration) {
    return completedKeys.indexOf(migration.name) == -1;
  });
}


FileStorageMigration.prototype.loadAllMigrations = function(callback) {
  var self = this;
  migrationFiles = fs.readdirSync(this.directory).filter(function(file){
    return file.match(/^\d+.*\.(js|((lit)?coffee|coffee\.md))$/);
  }).sort();

  var migrations = [];
  for (var i=0; i < migrationFiles.length; ++i) {
    var migrationFile = migrationFiles[i];
    migration = new Migration({
      name: migrationFile,
      path: path.join(self.directory, migrationFile)
    });
    migrations.push(migration);
  };
  callback(null, migrations);
}


FileStorageMigration.prototype.loadCompletedMigrations = function(callback) {
  fs.readFile(this.directory+'/.migrate', 'utf8', function(err, json){
    if (err && err.code == 'ENOENT') return callback(null, []);
    if (err) return callback(err);
    try {
      callback(null, JSON.parse(json));
    } catch (err) {
      callback(err);
    }
  });
}


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


FileStorageMigration.prototype.save = function(migration, callback) {
  var self = this;
  readJson(this.directory+'/.migrate', function(err, json){
    if (err) return callback(err);
    json.push({name: migration.name});
    fs.writeFile(this.directory+'/.migrate', json, callback)
  });
}


FileStorageMigration.prototype.delete = function(migration, callback) {
  var self = this;
  readJson(this.directory+'/.migrate', function(err, json){
    if (err) return callback(err);
    json = json.filter(function (mig) {
      return !self.compareMigration(mig, migration);
    });
    fs.writeFile(this.directory+'/.migrate', JSON.stringify(json), callback)
  });
}
