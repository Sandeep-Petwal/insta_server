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
const helmet = require('helmet');
app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const errorHandler = require('./middleware/errorHandler.js');
app.use(errorHandler);


// Logging   ------------------------------------
const { logMiddleware, errorLog } = require('./middleware/logging.js');
app.use(logMiddleware);
app.use(errorLog);




// Routes --------------------------------------
const routes = require('./routes/index.js');
app.use("/api", routes);

// Socket.IO  ------------------------------------
const { socketConfig } = require("./config/socket.config.js")
const io = new Server(httpServer, socketConfig);
require('./socket/socketHandler.js')(io);

const socketUtil = require('./util/socket.js');
socketUtil.init(io);



// Start the server --------------------------------
httpServer.listen(PORT, () => {
    console.log(`Server running on: ${SERVER_URL}`);
});
