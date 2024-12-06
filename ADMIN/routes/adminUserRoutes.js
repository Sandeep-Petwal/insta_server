const express = require("express");
const adminUserRoutes = express.Router();
const {
    logIn,
    verifyLogin,
    getAllUsers,
    getDashboardAnalytics,
    getUserDetails,
    changeStatus,
    getUserToken,
    editProfile,
    getSessions,
    deleteSession,
    deleteAllSessions
} = require("../controller/adminUserController");
const { authentication, verify } = require("../middleware/adminAuth");
const { storage, imageFileFilter } = require("../../util/multer.js");
const multer = require("multer");
const asyncHandler = require("../../middleware/asyncHandler");

adminUserRoutes.get("/", asyncHandler((req, res) => res.json({ status: "Working (admin/users)" })));

adminUserRoutes.post("/login", asyncHandler(logIn));
adminUserRoutes.post("/verify-login", asyncHandler(verifyLogin));
adminUserRoutes.post("/verify-token", asyncHandler(verify));

adminUserRoutes.get('/getall', authentication, asyncHandler(getAllUsers));
adminUserRoutes.get('/dashboard-analytics', authentication, asyncHandler(getDashboardAnalytics));

adminUserRoutes.get('/get-user/:user_id', authentication, asyncHandler(getUserDetails));

adminUserRoutes.post('/status/:user_id', authentication, asyncHandler(changeStatus));
adminUserRoutes.post('/get-token/:user_id', authentication, asyncHandler(getUserToken));

const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: imageFileFilter
});
adminUserRoutes.post("/edit/:user_id", upload.single("profile_img"), authentication, asyncHandler(editProfile));

// Session section
adminUserRoutes.get("/sessions/:user_id", authentication, asyncHandler(getSessions));
adminUserRoutes.delete("/session/:session_id", authentication, asyncHandler(deleteSession));
adminUserRoutes.delete("/sessions/:user_id", authentication, asyncHandler(deleteAllSessions));

module.exports = adminUserRoutes;