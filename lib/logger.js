/*
 * Winston logger configuration
 */

var config = require('./config');
var winston = require('winston');

var logger = new (winston.Logger)({
   transports: [
    new (winston.transports.Console)({
      level: 'development' == config.mode ? 'silly' : 'info',
      timestamp: true,
      colorize: 'true'})
  ]
});

// Enable tabulation for console transport
logger.cli();



if (config.log) {
  logger.add(winston.transports.File, {
      filename: config.log.fileName,
      maxsize:  config.log.fileMaxSize,
      maxFiles: config.log.filesMaxCount,
      timestamp: true,
      level: 'warn',
      json: false
  });
}



module.exports = logger;
