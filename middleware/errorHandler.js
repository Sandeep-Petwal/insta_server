const response = require('../util/response');

const errorHandler = (err, req, res, next) => {
    console.error('\n\nError:', err);
    console.error(typeof arr);

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') {
        return response.failed(res, err.errors[0].message);
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return response.failed(res, 'Duplicate entry found');
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return response.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return response.unauthorized(res, 'Token expired');
    }

    // Default server error
    return response.serverError(res);
};

module.exports = errorHandler;