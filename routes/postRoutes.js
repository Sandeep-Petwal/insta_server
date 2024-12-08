const express = require("express");
const postRoutes = express.Router();
const { addPost, deletePost, customizedFeed, getPost, getComments, addComment, editComment, setLikes, deleteComment } = require("../controller/postController");
const { authentication } = require('../middleware/authentication.js');
const multer = require("multer");
const asyncHandler = require("../middleware/asyncHandler.js");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            req.fileValidationError = "Only image files are allowed!";
            cb(null, false);
        }
    },
});

postRoutes.post("/add", upload.single("post"), asyncHandler(addPost));
postRoutes.delete("/delete/:id", asyncHandler(deletePost));
postRoutes.get("/feed", asyncHandler(customizedFeed));
postRoutes.get("/fullpost/:post_id", asyncHandler(getPost));
postRoutes.get("/comments/:post_id", asyncHandler(getComments));
postRoutes.post("/comments/:post_id", asyncHandler(addComment));
postRoutes.put("/comment/:comment_id", asyncHandler(editComment));
postRoutes.post("/like/:post_id", asyncHandler(setLikes));
postRoutes.delete("/comment/:comment_id", asyncHandler(deleteComment));

module.exports = postRoutes;