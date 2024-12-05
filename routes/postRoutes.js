const express = require("express");
const postRoutes = express.Router();
const postController = require("../controller/postController")
const multer = require("multer")
// const { storage, imageFileFilter } = require("../util/multer.js")
const auth = require('../middleware/authentication.js');


// adding new post , http://localhost:3005/api/post/add
// const upload = multer({
//     storage,
//     limits: { fileSize: 1 * 1024 * 1024 },
//     fileFilter: imageFileFilter
// });

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            req.fileValidationError = "Only image files are allowed!";
            cb(null, false);
        }
    },
});


postRoutes.post("/add", upload.single("post"), auth.authentication, postController.addPost);









// deleting the post
postRoutes.delete("/delete/:id", auth.authentication, postController.deletePost)


// getting all posts , http://localhost:3005/api/post/feed?user_id=7
// postRoutes.get("/feed", auth.authentication, postController.getPosts);     // all posts
postRoutes.get("/feed", auth.authentication, postController.customizedFeed);        // customized feed




postRoutes.get("/fullpost/:post_id", auth.authentication, postController.getPost); // load a full post with (commets + like), http://localhost:3005/api/post/fullpost/2


// get and add commment 
postRoutes.get("/comments/:post_id", auth.authentication, postController.getComments)
postRoutes.post("/comments/:post_id", auth.authentication, postController.addComment);
postRoutes.put("/comment/:comment_id", auth.authentication, postController.editComment);// edit comment,   // http://localhost:3005/api/post/comment/7


postRoutes.post("/like/:post_id", auth.authentication, postController.setLikes); // add and remove likes // http://localhost:3005/api/post/like/9
postRoutes.delete("/comment/:comment_id", auth.authentication, postController.deleteComment);// delete comment,   // http://localhost:3005/api/post/comment/7







module.exports = postRoutes