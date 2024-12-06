const { limiter, authLimit } = require("../middleware/rateLimit.js")
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const verificationRoutes = require("./verificationRoutes");
const messageRoutes = require("./messageRoutes")
const adminRoutes = require("../ADMIN/routes/index.js")
const supportRoutes = require("./supportRoutes");
const express = require("express");
const { authentication } = require("../middleware/authentication.js");

const routes = express.Router();

routes.use("/user", limiter, userRoutes);
routes.use("/post", limiter, postRoutes);
routes.use("/verify", authLimit, verificationRoutes);
routes.use("/messages", limiter, messageRoutes);
routes.use("/admin", limiter, adminRoutes);// admin routes
routes.use("/support", limiter, authentication, supportRoutes); // support routes

module.exports = routes
