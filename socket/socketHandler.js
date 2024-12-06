const notificationEvents = require("./notificationEvents");
const messageEvents = require("./messageEvents");
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

module.exports = (io) => {
    // socket middleware to protect WS
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.log("Failed WS Connection attempt.(No token provided)")
            return next(new Error('Authentication error: No token provided'));
        }

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                console.log("Failed WS Connection attempt.(Invalid token.)")
                return next(new Error('Authentication error: Invalid token'));
            }
            socket.user = decoded;
            next();
        })
    })


    io.on("connection", (socket) => {
        console.log(`\nUser connected :: ${socket.user.user_id} : ${socket.user.name}\n`);

        //  Notification Events
        notificationEvents(io, socket);

        //  Message Events
        messageEvents(io, socket);

        // Disconnect event
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user.user_id} : ${socket.user.name}`);
        });
    });
};
