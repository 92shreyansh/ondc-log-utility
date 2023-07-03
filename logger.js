const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, printf,colorize } = format;
const config = require("./config");

var logger;

function init() {
  if (!logger) {
    getLogger()
  }
  return logger
}

function getLogger() {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] [${level}]: ${message}`;
  });
  const log = config.getConfig()["log"];
  logger = createLogger({
    level: log["level"],
    format: combine(
      timestamp(),
      colorize(),
      myFormat 
    ),
    transports: [
      new transports.Console({
        level: "debug"
      }),
      new transports.DailyRotateFile({
        filename: 'log_report',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        level: log["level"]
      })
    ]
  });
  return logger
}



module.exports = {init};