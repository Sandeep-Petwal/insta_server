const Users = require("../model/userModel");
const Issues = require("../model/issuesModel");
const Issueschat = require("../model/issuesChatModel");
const { Op, where } = require('sequelize');
const response = require("../util/response")
const validate = require('../util/validator');
const Sequelize = require('sequelize')
const { literal } = require('sequelize');

const cloudinary = require('../config/cloudinaryConfig');
const { updateLocale } = require("moment");

// importing io from socket
const { getIO } = require('../util/socket');

// controller to get users issues list
exports.getIssues = async (req, res) => {
    console.log("Inside getIssues for chat:");
    const { user_id, limit = 10, page = 1, type = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // validation
    const rules = { user_id: "required|integer", limit: "required|integer", page: "required|integer", type: "string|in:all,pending,in_progress,Resolved" };
    let { status, message } = await validate({ user_id, limit, page, type }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    try {
        let whereClause = { user_id };
        if (type !== 'all') {
            whereClause.state = type;
        }

        const [issuesResult, pendingCount, inProgressCount, resolvedCount] = await Promise.all([
            Issues.findAndCountAll({
                where: whereClause,
                order: [['id', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            }),
            Issues.count({ where: { user_id, state: 'pending' } }),
            Issues.count({ where: { user_id, state: 'in_progress' } }),
            Issues.count({ where: { user_id, state: 'Resolved' } })
        ]);

        return response.success(res, "Issues list", {
            issues: issuesResult.rows,
            count: issuesResult.count,
            totalPages: Math.ceil(issuesResult.count / limit),
            currentPage: parseInt(page),
            pending: pendingCount,
            in_progress: inProgressCount,
            resolved: resolvedCount
        });

    } catch (error) {
        console.error(error);
        return response.failed(res, "Something went wrong.");
    }
}

// get a single issue by id
exports.getIssue = async (req, res) => {
    const { id } = req.params;
    // validation
    const rules = { id: "required|integer" };
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    try {
        const issue = await Issues.findOne({ where: { id } });
        if (!issue) return response.failed(res, "Issue not found.");

        return response.success(res, "Success", issue);
    } catch (error) {
        console.error(error);
        return response.failed(res, "Something went wrong.");
    }
}


// resolve a issue by id
exports.resolveIssue = async (req, res) => {
    const { issue_id } = req.params;
    const { resolve_message = "resolved" } = req.body;

    // Validation
    const rules = { issue_id: "required|integer", resolve_message: "required|string" };
    let { status, message } = await validate({ issue_id, resolve_message }, rules);

    if (!status) {
        return response.failed(res, "Provide correct information.", message);
    }

    try {
        // Update the issue
        const updatedRowsCount = await Issues.update(
            { state: "Resolved", resolve_message },
            { where: { id: issue_id } }
        );

        if (updatedRowsCount === 0) {
            return response.failed(res, "Issue not found.");
        }

        const updatedIssue = await Issues.findOne({ where: { id: issue_id } });

        if (!updatedIssue) {
            return response.failed(res, "Unable to fetch updated issue.");
        }

        return response.success(res, "Issue resolved successfully.", updatedIssue);
    } catch (error) {
        console.error("Error resolving issue:", error);
        return response.failed(res, "Something went wrong.");
    }
};




// add a new issue
exports.addIssue = async (req, res) => {
    const { user_id, type = "others", description = "" } = req.body;

    // validation
    const rules = { user_id: "required|integer", type: "required|string", description: "required|string" };
    let { status, message } = await validate({ user_id, type, description }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    if (req.fileValidationError) {
        return response.failed(res, "Invalid file !", req.fileValidationError)
    }

    // Determine screenshot URL if file is provided
    let screenshotUrl = null;


    // Handle image upload if present
    // Handle Cloudinary upload if file is present
    if (req.file) {
        try {
            screenshotUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "instabook_support_tickets",
                        public_id: `support_user_${user_id}_${Date.now()}`
                    }, // Optional folder for organization
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url); // Cloudinary's URL
                    }
                );
                uploadStream.end(req.file.buffer); // Pipe file buffer to Cloudinary
            });
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            return response.failed(res, "Failed to upload image to Cloudinary.");
        }
    } else {
        console.log("\n\nFile is not available");
    }



    try {
        const newIssue = await Issues.create({ user_id, type, description, screenshotUrl });
        if (newIssue) return response.success(res, "Issue added successfully.");
    } catch (error) {
        console.error(error);
        return response.failed(res, "Something went wrong.");
    }
}



// ******************************* chat ******************************* 

// get issue conversation
exports.getIssueConversation = async (req, res) => {
    const { id } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const rules = {
        id: "required|numeric",
        limit: "required|numeric",
        page: "required|numeric"
    }
    let { status, message } = await validate({ id, limit, page }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    try {
        const issue = await Issues.findOne({ where: { id } });
        if (!issue) return response.success(res, "Issue not found.", []);

        const { count, rows: issueConversation } = await Issueschat.findAndCountAll({
            where: { issue_id: id },
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalPages = Math.ceil(count / limit);

        return response.success(res, "Success", {
            conversations: issueConversation,
            currentPage: parseInt(page),
            totalPages,
            totalCount: count
        });
    } catch (error) {
        console.error(error);
        return response.serverError(res)
    }
}



// add new message with optional image upload
exports.addIssueChat = async (req, res) => {
    const { issue_id, text = "", sender_id, receiver_id } = req.body;
    const rules = { issue_id: "required|numeric", sender_id: "required|numeric", receiver_id: "required|numeric" };
    let { status, message } = await validate({ issue_id, text, sender_id, receiver_id }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    if (req.fileValidationError) {
        return response.failed(res, "Invalid file !", req.fileValidationError)
    }

    // either image or test should be provided 
    if (!req.file && (text.trim() == "")) return response.failed(res, "Provide either image or text.");

    let screenshotUrl = null;
    if (req.file) {
        try {
            screenshotUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `instabook_support_tickets/chat/${issue_id}`,
                        public_id: `issue_${issue_id}_${Date.now()}`
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            return response.failed(res, "Failed to upload image to Cloudinary.");
        }
    } else console.log("\n\nFile is not available");

    try {
        let chat = await Issueschat.create({ issue_id, sender_id, receiver_id, image_url: screenshotUrl, text });
        chat = { ...chat.dataValues, screenshotUrl };

        // send socket event
        const io = getIO();
        io.emit(`support-${issue_id}`, chat);

        return response.success(res, "Message added successfully.", chat);
    } catch (error) {
        console.error(error);
        return response.failed(res, "Something went wrong.");
    }
}



// // contrller to send a testing event
// exports.sendTestEvent = async (req, res) => {
//     const io = getIO();
//     io.emit("notification-10", "testing event");
//     return response.success(res, "Event sent successfully.");
// }