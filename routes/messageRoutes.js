const express = require("express");
const messageRoutes = express.Router();
const messageController = require("../controller/messageController")
const auth = require('../middleware/authentication.js');
const { limiter } = require("../middleware/rateLimit.js")


// get all user for chat // http://localhost:3005/api/messages/users/4
messageRoutes.get("/users/", auth.authentication, messageController.getAllUsers)

messageRoutes.get("/conversation/", limiter, auth.authentication, messageController.getConversation); // load conversation
messageRoutes.delete("/delete/:id", auth.authentication, messageController.deleteMessage);
messageRoutes.put("/edit/:id", auth.authentication, messageController.editMessage);    // http://localhost:3000/api/messages/edit/90

module.exports = messageRoutes