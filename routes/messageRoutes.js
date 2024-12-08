const express = require("express");
const messageRoutes = express.Router();
const { getAllUsers, getConversation, deleteMessage, editMessage } = require("../controller/messageController");
const asyncHandler = require("../middleware/asyncHandler.js");

messageRoutes.get("/users/", asyncHandler(getAllUsers));
messageRoutes.get("/conversation/", asyncHandler(getConversation));
messageRoutes.delete("/delete/:id", asyncHandler(deleteMessage));
messageRoutes.put("/edit/:id", asyncHandler(editMessage));

module.exports = messageRoutes;