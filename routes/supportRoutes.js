const express = require("express");
const supportRoutes = express.Router();
const { getIssue, getIssues, addIssue, addIssueChat, resolveIssue, getIssueConversation } = require("../controller/issuesController.js")
const multer = require('multer');
const asyncHandler = require("../middleware/asyncHandler.js");


supportRoutes.get("/issues", asyncHandler(getIssues));
supportRoutes.get("/issue/:id", asyncHandler(getIssue));
supportRoutes.post("/resolve/:issue_id", asyncHandler(resolveIssue));
supportRoutes.get("/conversation/:id", asyncHandler(getIssueConversation));


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
supportRoutes.post("/add-issue", upload.single("screenshot"), asyncHandler(addIssue));// add new issue
supportRoutes.post("/add-message", upload.single("conversation_image"), asyncHandler(addIssueChat));// add new message

module.exports = supportRoutes
