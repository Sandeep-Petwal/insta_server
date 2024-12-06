const winston = require('winston');

const logger = winston.createLogger({
    level: 'info', // Default level (other :: 'debug', 'info', 'warn', 'error', etc.)
    format: winston.format.combine(
        winston.format.colorize(), //  color to logs for better readability
        winston.format.timestamp(), //  timestamp to each log entry
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`; // Custom log format
        })
    ),
    transports: [
        new winston.transports.Console(), // Log to the console
        new winston.transports.File({ filename: 'app.log' }) // Log to a file
    ],
});

module.exports = logger;
