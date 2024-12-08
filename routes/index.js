const { limiter, authLimit } = require("../middleware/rateLimit.js")
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const verificationRoutes = require("./verificationRoutes");
const messageRoutes = require("./messageRoutes")
const adminRoutes = require("../ADMIN/routes/index.js")
const supportRoutes = require("./supportRoutes");
const authRoutes = require("./authRoutes.js")
const express = require("express");
const { authentication } = require("../middleware/authentication.js");

const routes = express.Router();

routes.use("/user", authLimit, authRoutes)
routes.use("/verify", authLimit, verificationRoutes);

routes.use("/user", limiter,authentication,  userRoutes);
routes.use("/post", limiter, authentication, postRoutes);
routes.use("/messages", limiter, authentication, messageRoutes);
routes.use("/admin", limiter, adminRoutes);// admin routes
routes.use("/support", limiter, authentication, supportRoutes); // support routes

module.exports = routes
