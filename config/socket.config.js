module.exports.socketConfig = {
    cors: {
        origin: "*" || "*",
        // origin: "*",
        methods: ["GET", "POST"]
    },
};


// module.exports.socketConfig = {
//     cors: {
//         origin: process.env.CLIENT_URL || "*",
//         // origin: "*",
//         methods: ["GET", "POST"]
//     },
// };
