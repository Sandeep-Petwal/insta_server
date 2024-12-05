const { limiter, authLimit } = require("../middleware/rateLimit.js")
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const verificationRoutes = require("./verificationRoutes");
const messageRoutes = require("./messageRoutes")
const adminRoutes = require("../ADMIN/routes/index.js")
const supportRoutes = require("./supportRoutes")



module.exports = [
  { path: "/api/user", limiter, route: userRoutes },
  { path: "/api/post", limiter, route: postRoutes },
  { path: "/api/verify", authLimit, route: verificationRoutes },
  { path: "/api/messages", limiter, route: messageRoutes },

  // admin routes
  { path: "/api/admin", limiter, route: adminRoutes },

  // support routes
  { path: "/api/support", limiter, route: supportRoutes },

];




// OLD Method
// const userRoutes = require("./routes/userRoutes");
// const postRoutes = require("./routes/postRoutes");
// const verificationRoutes = require("./routes/verificationRoutes");
// app.use("/api/user", userRoutes);
// app.use("/api/post", postRoutes);
// app.use("/api/verify", verificationRoutes);