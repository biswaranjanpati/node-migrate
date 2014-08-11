var FileStorageMigration = require('./lib/file-storage-migration');
exports = module.exports = FileStorageMigration;
exports.version = '0.1.3';
exports.Migration = require('./lib/migration');
exports.MigrationManager = require('./lib/migration-manager');
exports.FileStorageMigration = FileStorageMigration;
