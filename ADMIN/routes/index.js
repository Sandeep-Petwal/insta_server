const express = require("express");
const adminRoutes = express.Router();
const adminUserRoutes = require("./adminUserRoutes")
const adminPostRoutes = require("./adminPostRoutes")
const adminTicketsRoutes = require('./adminTicketsRoutes')
const adminLogger = require('../middleware/adminLogger');

// admin
adminRoutes.get("/", (req, res) => res.json({ status: "Working. (Admin)", routes: { posts: "/posts", users: "/users" } }))

// admin users routes
adminRoutes.use("/users", adminLogger, adminUserRoutes);

// admin posts routes
adminRoutes.use("/posts", adminLogger, adminPostRoutes)

// admin tickets routes TODO: add logger
adminRoutes.use("/tickets", adminTicketsRoutes)



module.exports = adminRoutes