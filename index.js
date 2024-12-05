// Imports  ------------------------------------
require("dotenv").config();
const SERVER_URL = process.env.SERVER_URL;
const PORT = process.env.PORT;
const express = require("express");
const path = require("path");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");


const app = express();
const httpServer = createServer(app);

// Middlewares ---------------------------------
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Routes --------------------------------------
const routes = require('./routes');
routes.forEach(({ path, route }) => app.use(path, route));

// Socket.IO  ------------------------------------
const { socketConfig } = require("./config/socket.config")
const io = new Server(httpServer, socketConfig);
require('./socket/socketHandler')(io);

const socketUtil = require('./util/socket');
socketUtil.init(io);



// Start the server --------------------------------
httpServer.listen(PORT, () => {
    console.log(`Server running on: ${SERVER_URL}`);
});
