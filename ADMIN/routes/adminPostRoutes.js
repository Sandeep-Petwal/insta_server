const express = require("express");
const adminUserController = require("../controller/adminUserController");
const adminPostController = require("../controller/adminPostController");
const adminAuth = require("../middleware/adminAuth")
const adminPostRoutes =  express.Router();




adminPostRoutes.get("/", (req, res) => {
    res.json({status : "Working", route : "admin/post"})
})


adminPostRoutes.get('/get-posts', adminAuth.authentication, adminPostController.getAllPosts);
adminPostRoutes.delete("/delete/:id", adminAuth.authentication, adminPostController.deletePost)


module.exports = adminPostRoutes