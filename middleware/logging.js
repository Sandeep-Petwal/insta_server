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


const logMiddleware = (req, res, next) => {
    logger.info(`\nRequest Method: ${req.method} | Request URL: ${req.url}`);
    next();
};

const errorLog = (err, req, res, next) => {
    logger.error(`Error occurred: ${err.message}\nStack: ${err.stack}`);

    res.status(err.status || 500).send({
        message: 'An unexpected error occurred. Please try again later.',
        error: 'An unexpected error occurred. Please try again later.',
    });
};







module.exports = { logger, logMiddleware, errorLog };
