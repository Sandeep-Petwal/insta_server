const express = require("express");
const adminUserRoutes = express.Router();
const adminUserController = require("../controller/adminUserController");
const adminAuth = require("../middleware/adminAuth")
const { storage, imageFileFilter } = require("../../util/multer.js");
const multer = require("multer");


adminUserRoutes.get("/", (req, res) => { res.json({ status: "Working (admin/users)" }) });

adminUserRoutes.post("/login", adminUserController.logIn);
adminUserRoutes.post("/verify-login", adminUserController.verifyLogin)
adminUserRoutes.post("/verify-token", adminAuth.verify)


adminUserRoutes.get('/getall', adminAuth.authentication, adminUserController.getAllUsers); // get all user
adminUserRoutes.get('/dashboard-analytics', adminAuth.authentication, adminUserController.getDashboardAnalytics);

adminUserRoutes.get('/get-user/:user_id', adminAuth.authentication, adminUserController.getUserDetails); // get full user

adminUserRoutes.post('/status/:user_id', adminAuth.authentication, adminUserController.changeStatus)  // delete/block/active
adminUserRoutes.post('/get-token/:user_id', adminAuth.authentication, adminUserController.getUserToken)  // get token to login as user

const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: imageFileFilter
});
adminUserRoutes.post("/edit/:user_id", upload.single("profile_img"), adminAuth.authentication, adminUserController.editProfile)



// *********************************Session section********************************
adminUserRoutes.get("/sessions/:user_id", adminAuth.authentication, adminUserController.getSessions);                  // route to get all sessions of user
adminUserRoutes.delete("/session/:session_id", adminAuth.authentication, adminUserController.deleteSession);  // route to delete session
adminUserRoutes.delete("/sessions/:user_id", adminAuth.authentication, adminUserController.deleteAllSessions);        // route to delete all sessions acxept current






module.exports = adminUserRoutes