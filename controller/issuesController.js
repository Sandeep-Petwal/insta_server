const Issues = require("../model/issuesModel");
const Issueschat = require("../model/issuesChatModel");
const response = require("../util/response")
const validate = require('../util/validator');
const cloudinary = require('../config/cloudinaryConfig');
const { getIO } = require('../util/socket');



// controller to get users issues list
exports.getIssues = async (req, res) => {
    console.log("Inside getIssues for chat:");
    const { user_id, limit = 10, page = 1, type = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // validation
    const rules = { user_id: "required|integer|exist:users,user_id", limit: "required|integer", page: "required|integer", type: "string|in:all,pending,in_progress,Resolved" };
    let { status, message } = await validate({ user_id, limit, page, type }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

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
}

// get a single issue by id
exports.getIssue = async (req, res) => {
    const { id } = req.params;
    // validation
    const rules = { id: "required|integer|exist:issues,id" };
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    const issue = await Issues.findOne({ where: { id } });
    if (!issue) return response.failed(res, "Issue not found.");
    return response.success(res, "Success", issue);
}


// resolve a issue by id
exports.resolveIssue = async (req, res) => {
    const { issue_id } = req.params;
    const { resolve_message = "resolved" } = req.body;

    // Validation
    const rules = { issue_id: "required|integer|exist:issues,id", resolve_message: "required|string" };
    let { status, message } = await validate({ issue_id, resolve_message }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    // Update the issue
    const updatedRowsCount = await Issues.update(
        { state: "Resolved", resolve_message },
        { where: { id: issue_id } }
    );

    if (updatedRowsCount === 0) return response.failed(res, "Issue not found.");
    const updatedIssue = await Issues.findOne({ where: { id: issue_id } });
    if (!updatedIssue) return response.failed(res, "Unable to fetch updated issue.");
    return response.success(res, "Issue resolved successfully.", updatedIssue);
};




// add a new issue
exports.addIssue = async (req, res) => {
    console.log("\n\ninside add issue")
    const { user_id, type = "others", description = "" } = req.body;

    // validation
    const rules = { user_id: "required|integer|exist:users,user_id", type: "required|string", description: "required|string" };
    let { status, message } = await validate({ user_id, type, description }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    if (req.fileValidationError) {
        return response.failed(res, "Invalid file !", req.fileValidationError)
    }

    try {
        // Determine screenshot URL if file is provided
        let screenshotUrl = null;

        // Handle Cloudinary upload if file is present
        if (req.file) {
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
        }

        const newIssue = await Issues.create({ user_id, type, description, screenshotUrl });
        if (newIssue) return response.success(res, "Issue added successfully.");

    } catch (error) {
        console.log("\n\nError : " + error);
        return response.serverError(res);
    }


}



// ******************************* chat ******************************* 

// get issue conversation
exports.getIssueConversation = async (req, res) => {
    const { id } = req.params;
    const { limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const rules = {
        id: "required|numeric|exist:issues,id",
        limit: "required|numeric",
        page: "required|numeric"
    }
    let { status, message } = await validate({ id, limit, page }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

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

    let chat = await Issueschat.create({ issue_id, sender_id, receiver_id, image_url: screenshotUrl, text });
    chat = { ...chat.dataValues, screenshotUrl };

    // send socket event
    const io = getIO();
    io.emit(`support-${issue_id}`, chat);

    return response.success(res, "Message added successfully.", chat);
}
