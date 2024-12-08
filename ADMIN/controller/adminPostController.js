var jwt = require('jsonwebtoken');
const response = require("../../util/response")
const secret = process.env.SECRET_KEY
const speakeasy = require("speakeasy");
const bcrypt = require('bcrypt');
const validate = require('../../util/validator');
const { literal, Op } = require('sequelize');
const path = require("path");
// const fs = require('fs')
const fs = require('fs').promises;
const { Users, Posts, Comments, Like, Follow } = require('../../model/index.js');
const sequelize = require('../../database/database.js');






// get all users
exports.getAllPosts = async (req, res) => {
    const { limit = 10, page = 1, sortColumn = 'id', sortDirection = 'asc', search = "" } = req.query;
    const rules = { limit: "numeric", page: "numeric" };
    let { status, message } = await validate({ limit, page }, rules);
    if (!status) return response.failed(res, message);


    if (!['asc', 'desc'].includes(sortDirection.toLowerCase())) {
        return response.failed(res, `Invalid sort direction. Use "asc" or "desc`, `Invalid sort direction. Use "asc" or "desc"`)
    }
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (search) {
        whereCondition = {
            [Op.or]: [
                { caption: { [Op.like]: `%${search}%` } },
                { user_id: { [Op.like]: `%${search}%` } },
                { createdAt: { [Op.like]: `%${search}%` } }
            ]
        };
    }


    const { count, rows } = await Posts.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
            [sortColumn, sortDirection.toLowerCase()]
        ],
        include: [{
            model: Users,
            attributes: ['name', 'email', 'user_id'],
        }],
        attributes: {
            include: [
                [literal(`(SELECT COUNT(*) FROM Likes WHERE Likes.postId = Posts.id)`), 'Likes'],
                [literal('(SELECT COUNT(*) FROM comments WHERE comments.post_id = Posts.id)'), 'Comments'],
            ]
        },
    });

    const totalPages = Math.ceil(count / limit);

    if (rows.length === 0) {
        return res.json({ users: rows, count, totalPages, currentPage: parseInt(page), });
    }

    res.json({
        users: rows,
        count,
        totalPages,
        currentPage: parseInt(page),
    });

}

// delete a post
exports.deletePost = async (req, res) => {
    console.log("inside deletePost ::");
    const { id } = req.params;


    const rules = { id: "required|numeric|exist:Posts,id" };
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, message);

    // get the post &  image path
    const post = await Posts.findOne({ where: { id }, attributes: ['image_path'] });
    if (!post) return response.failed(res, `No post found for post ${id}.`);

    // remove post
    const deletedRows = await Posts.destroy({ where: { id } });
    if (deletedRows === 0) {
        return response.failed(res, "Failed to delete the post.");
    }

    // also remove post image
    // if (post.image_path) {
    //     const imagePath = path.join(__dirname, '../../', post.image_path);
    //     fs.unlink(imagePath, (err) => {
    //         if (err) console.error("error deleting post image:", err);
    //         else console.log("Post image deleted successfully");
    //     });
    // }
    return response.success(res, `Successfully deleted the post : ${id}.`);
};
