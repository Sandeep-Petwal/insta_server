const express = require("express");
const messageRoutes = express.Router();
const { getAllUsers, getConversation, deleteMessage, editMessage } = require("../controller/messageController");
const { authentication } = require('../middleware/authentication.js');
const { limiter } = require("../middleware/rateLimit.js");
const asyncHandler = require("../middleware/asyncHandler.js");

messageRoutes.get("/users/", authentication, asyncHandler(getAllUsers));
messageRoutes.get("/conversation/", limiter, authentication, asyncHandler(getConversation));
messageRoutes.delete("/delete/:id", authentication, asyncHandler(deleteMessage));
messageRoutes.put("/edit/:id", authentication, asyncHandler(editMessage));

module.exports = messageRoutes;