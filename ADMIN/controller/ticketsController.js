const { Issues, Users, Issueschat } = require("../../model")
const validate = require('../../util/validator');
const response = require("../../util/response");
const { literal } = require("sequelize");


// get all issues list for admin with sort and pagination
const getAllIssues = async (req, res) => {
    const { page = 1, limit = 10, type = "all" } = req.query;
    const rules = {
        page: "required|numeric",
        limit: "required|numeric",
        type: "string|in:all,pending,in_progress,resolved"
    }
    let { status, message } = await validate({ limit, page, type }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    const offset = (page - 1) * limit;
    try {

        let whereClause = {};
        if (type !== 'all') {
            whereClause.state = type;
        }
        const { count, rows } = await Issues.findAndCountAll({
            where: whereClause,
            include: {
                model: Users,
                as: "user",
                attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'two_factor_secret'] }
            },
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            count,
            rows,
            limit,
            page,
            total_pages: Math.ceil(count / limit)
        })
    } catch (error) {
        console.error(error);
        return response.serverError(res)
    }
}

// get a single issue for admin
const getIssue = async (req, res) => {
    const { id } = req.params;
    const rules = {
        id: "required|numeric"
    }
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    try {
        const issue = await Issues.findOne({
            where: { id },
            include: {
                model: Users,
                as: "user",
                attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'two_factor_secret'] }
            }
        });
        if (!issue) return response.success(res, "Issue not found.", []);

        return response.success(res, "Success", issue);
    } catch (error) {
        console.error(error);
        return response.serverError(res)
    }
}


// // get issue conversation
// const getIssueConversation = async (req, res) => {
//     const { id } = req.params;
//     const rules = {
//         id: "required|numeric"
//     }
//     let { status, message } = await validate({ id }, rules);
//     if (!status) return response.failed(res, "Provide correct information.", message);

//     try {
//         const issue = await Issues.findOne({ where: { id } });
//         if (!issue) return response.success(res, "Issue not found.", []);

//         const issueConversation = await Issueschat.findAll({
//             where: { issue_id: id },
//             order: [['id', 'DESC']]
//         });

//         return response.success(res, "Success", issueConversation);
//     } catch (error) {
//         console.error(error);
//         return response.serverError(res)
//     }
// }


module.exports = { getAllIssues, getIssue }