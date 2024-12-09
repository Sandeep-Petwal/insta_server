const { limiter, authLimit } = require("../middleware/rateLimit.js")
const userRoutes = require("./userRoutes.js");
const postRoutes = require("./postRoutes.js");
const verificationRoutes = require("./verificationRoutes.js");
const messageRoutes = require("./messageRoutes.js")
const adminRoutes = require("../ADMIN/routes/index.js")
const supportRoutes = require("./supportRoutes.js");
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
