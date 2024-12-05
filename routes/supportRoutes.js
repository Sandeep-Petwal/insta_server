const express = require("express");
const supportRoutes = express.Router();
const issuesController = require("../controller/issuesController.js")
const { authentication } = require('../middleware/authentication.js');
const { storage_support, imageFileFilter } = require("../util/multer.js")
const multer = require('multer');


supportRoutes.get("/issues", authentication, issuesController.getIssues);  // get issues list
supportRoutes.get("/issue/:id", authentication, issuesController.getIssue); // get a single issue
supportRoutes.post("/resolve/:issue_id", authentication, issuesController.resolveIssue);// resolve a issue by id
supportRoutes.get("/conversation/:id", issuesController.getIssueConversation);// get issue conversation


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
supportRoutes.post("/add-issue", authentication, upload.single("screenshot"), issuesController.addIssue);// add new issue
supportRoutes.post("/add-message", authentication, upload.single("conversation_image"), issuesController.addIssueChat);// add new message

module.exports = supportRoutes