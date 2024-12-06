const express = require("express");
const { getAllPosts, deletePost } = require("../controller/adminPostController");
const { authentication } = require("../middleware/adminAuth");
const asyncHandler = require("../../middleware/asyncHandler");
const adminPostRoutes = express.Router();

adminPostRoutes.get("/", asyncHandler((req, res) => {
    res.json({ status: "Working", route: "admin/post" });
}));

adminPostRoutes.get('/get-posts', authentication, asyncHandler(getAllPosts));
adminPostRoutes.delete("/delete/:id", authentication, asyncHandler(deletePost));

module.exports = adminPostRoutes;
