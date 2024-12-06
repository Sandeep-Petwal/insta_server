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

postRoutes.post("/add", upload.single("post"), authentication, asyncHandler(addPost));
postRoutes.delete("/delete/:id", authentication, asyncHandler(deletePost));
postRoutes.get("/feed", authentication, asyncHandler(customizedFeed));
postRoutes.get("/fullpost/:post_id", authentication, asyncHandler(getPost));
postRoutes.get("/comments/:post_id", authentication, asyncHandler(getComments));
postRoutes.post("/comments/:post_id", authentication, asyncHandler(addComment));
postRoutes.put("/comment/:comment_id", authentication, asyncHandler(editComment));
postRoutes.post("/like/:post_id", authentication, asyncHandler(setLikes));
postRoutes.delete("/comment/:comment_id", authentication, asyncHandler(deleteComment));

module.exports = postRoutes;