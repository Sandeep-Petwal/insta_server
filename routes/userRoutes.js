const express = require("express");
const userRoutes = express.Router();
const cloudinary = require('../config/cloudinaryConfig');
const multer = require("multer");
const { 
    logIn, 
    logOut, 
    getUser, 
    getUserPosts, 
    searchUsers, 
    editProfile, 
    softDelete, 
    getSessions, 
    deleteSession, 
    deleteAllSessions 
} = require("../controller/userController");
const { 
    follow, 
    acceptRequest, 
    deleteRequest, 
    unfollow, 
    getFollowrequests, 
    getFollowers, 
    getFollowing 
} = require("../controller/followController");
const { 
    getNotificaton, 
    getUnreadCount 
} = require("../controller/notification");
const { authentication, verify } = require('../middleware/authentication');
const { authLimit } = require("../middleware/rateLimit");
const asyncHandler = require("../middleware/asyncHandler");

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

userRoutes.post("/login", asyncHandler(logIn));
userRoutes.get("/logout", authentication, asyncHandler(logOut));
userRoutes.get("/profile/:user_id", authentication, asyncHandler(getUser));
userRoutes.post("/verify", verify);
userRoutes.get("/posts", authentication, asyncHandler(getUserPosts));
userRoutes.get("/search/", authentication, asyncHandler(searchUsers));

userRoutes.get('/notification/:user_id', authentication, asyncHandler(getNotificaton));
userRoutes.get('/notification/unread/:user_id', asyncHandler(getUnreadCount));

userRoutes.put("/edit/:user_id", upload.single("profile"), authentication, asyncHandler(editProfile));
userRoutes.delete("/delete/:user_id", authLimit, authentication, asyncHandler(softDelete));

userRoutes.get("/sessions", authentication, asyncHandler(getSessions));
userRoutes.delete("/session/:session_id", authentication, asyncHandler(deleteSession));
userRoutes.delete("/sessions", authentication, asyncHandler(deleteAllSessions));

userRoutes.post("/follow", authentication, asyncHandler(follow));
userRoutes.post("/follow/accept", authentication, asyncHandler(acceptRequest));
userRoutes.post("/follow/delete", authentication, asyncHandler(deleteRequest));
userRoutes.post("/unfollow", authentication, asyncHandler(unfollow));
userRoutes.get("/follow/requests/:user_id", authentication, asyncHandler(getFollowrequests));
userRoutes.get("/followers/:user_id", authentication, asyncHandler(getFollowers));
userRoutes.get("/following/:user_id", authentication, asyncHandler(getFollowing));

module.exports = userRoutes;