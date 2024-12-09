const express = require("express");
const userRoutes = express.Router();
const cloudinary = require('../config/cloudinaryConfig.js');
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
} = require("../controller/userController.js");
const {
    follow,
    acceptRequest,
    deleteRequest,
    unfollow,
    getFollowrequests,
    getFollowers,
    getFollowing
} = require("../controller/followController.js");
const {
    getNotificaton,
    getUnreadCount
} = require("../controller/notification.js");
const { authentication, verify } = require('../middleware/authentication.js');
const { authLimit } = require("../middleware/rateLimit.js");
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




userRoutes.get("/logout", asyncHandler(logOut));
userRoutes.get("/profile/:user_id", asyncHandler(getUser));
userRoutes.get("/posts", asyncHandler(getUserPosts));
userRoutes.get("/search/", asyncHandler(searchUsers));

userRoutes.get('/notification/:user_id', asyncHandler(getNotificaton));
userRoutes.get('/notification/unread/:user_id', asyncHandler(getUnreadCount));

userRoutes.put("/edit/:user_id", upload.single("profile"), asyncHandler(editProfile));
userRoutes.delete("/delete/:user_id", authLimit, asyncHandler(softDelete));

userRoutes.get("/sessions", asyncHandler(getSessions));
userRoutes.delete("/session/:session_id", asyncHandler(deleteSession));
userRoutes.delete("/sessions", asyncHandler(deleteAllSessions));

userRoutes.post("/follow", asyncHandler(follow));
userRoutes.post("/follow/accept", asyncHandler(acceptRequest));
userRoutes.post("/follow/delete", asyncHandler(deleteRequest));
userRoutes.post("/unfollow", asyncHandler(unfollow));
userRoutes.get("/follow/requests/:user_id", asyncHandler(getFollowrequests));
userRoutes.get("/followers/:user_id", asyncHandler(getFollowers));
userRoutes.get("/following/:user_id", asyncHandler(getFollowing));

module.exports = userRoutes;