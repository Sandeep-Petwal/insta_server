const express = require("express");
const userRoutes = express.Router();
// const userController = require("../controller/userController")
// const followController = require("../controller/followController.js")
const cloudinary = require('../config/cloudinaryConfig');

const { userController, followController, notification } = require("../controller")
const auth = require('../middleware/authentication.js');
const multer = require("multer")
// const { storage, imageFileFilter } = require("../util/multer.js")
const { authLimit } = require("../middleware/rateLimit.js")



userRoutes.post("/login", userController.logIn);
// logout route
userRoutes.get("/logout", auth.authentication, userController.logOut);

userRoutes.get("/profile/:user_id", auth.authentication, userController.getUser) //  http://localhost:3005/api/user/profile/10


userRoutes.post("/verify", auth.verify)     // verification of token
userRoutes.get("/posts", auth.authentication, userController.getUserPosts);   // all posts of user
userRoutes.get("/search/", auth.authentication, userController.searchUsers); // search

// notifications ----------------------------------------
userRoutes.get('/notification/:user_id', auth.authentication, notification.getNotificaton);
userRoutes.get('/notification/unread/:user_id', notification.getUnreadCount)
// userRoutes.get("/notification/read")


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


userRoutes.put("/edit/:user_id", upload.single("profile"), auth.authentication, userController.editProfile);

// permanently delete account
// userRoutes.delete("/delete/:user_id", authLimit, auth.authentication, userController.deleteAccount)

// soft delete
userRoutes.delete("/delete/:user_id", authLimit, auth.authentication, userController.softDelete)


// ***************************** Sessions section ********************************

userRoutes.get("/sessions", auth.authentication, userController.getSessions);                  // route to get all sessions of user
userRoutes.delete("/session/:session_id", auth.authentication, userController.deleteSession);  // route to delete session
userRoutes.delete("/sessions", auth.authentication, userController.deleteAllSessions);        // route to delete all sessions acxept current


// ***************************** Follow section ********************************
userRoutes.post("/follow", auth.authentication, followController.follow)              //pending..
userRoutes.post("/follow/accept", auth.authentication, followController.acceptRequest);     //accepted
userRoutes.post("/follow/delete", auth.authentication, followController.deleteRequest);     // delete request
userRoutes.post("/unfollow", auth.authentication, followController.unfollow)        //unfollow
userRoutes.get("/follow/requests/:user_id", auth.authentication, followController.getFollowrequests)    //get follow requests


userRoutes.get("/followers/:user_id", auth.authentication, followController.getFollowers)    //get followers
userRoutes.get("/following/:user_id", auth.authentication, followController.getFollowing)    //get following


module.exports = userRoutes