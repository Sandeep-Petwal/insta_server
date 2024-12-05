const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.SECRET);
        socket.user = decoded;
        
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};