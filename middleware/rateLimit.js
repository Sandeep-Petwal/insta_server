const rateLimit = require('express-rate-limit');

// rate limiter middleware
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // time in ms (1 min)
    max: 30, // Limit each IP
    standardHeaders: true,
    legacyHeaders: false,
});

// rate limit for auth routes
const authLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});


module.exports = { limiter, authLimit };
