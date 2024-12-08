const { Users, Posts, Comments, Like } = require("../model/index.js");
const response = require("../util/response")
const validate = require('../util/validator');
const { QueryTypes } = require('sequelize');
const sequelize = require("../database/database.js");
const Sequelize = require('sequelize')
const { literal, Op } = require('sequelize');
const fs = require('fs');
const path = require('path')
const { addNotification } = require("./notification.js")
const cloudinary = require('../config/cloudinaryConfig');

exports.getPosts = async (req, res) => {
    console.log("Inside getPosts");
    const { user_id, limit = 10, page = 1 } = req.query;

    const rules = { user_id: "required|exist:users,user_id", limit: "required|numeric", page: "required|numeric" };
    let { status, message } = await validate({ user_id, limit, page }, rules);
    if (!status) return response.failed(res, message);
    const offset = (page - 1) * limit;


    const { count, rows } = await Posts.findAndCountAll({
        include: [
            {
                model: Users,
                as: "user",
                attributes: ['username', 'user_id', 'name', 'profile_url', 'profile_img'],
            }
        ],
        attributes: {
            include: [
                [literal(`(SELECT COUNT(*) FROM Likes WHERE Likes.postId = Posts.id)`), "likeCount"],
                [literal(`(SELECT COUNT(*) > 0 FROM Likes WHERE Likes.postId = Posts.id AND Likes.user_id = ${user_id})`), "liked"],
                [literal(`(SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id)`), "commentCount"]
            ]
        },
        order: [['id', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    if (rows.length === 0) {
        return response.noContent(res, "No posts found !");
    }

    res.json({
        posts: rows,
        count,
        totalPages,
        currentPage: parseInt(page),
    });
};

exports.customizedFeed = async (req, res) => {
    console.log("\n\nInside getPosts");
    const { user_id, limit = 10, page = 1 } = req.query;

    const rules = { user_id: "required|exist:users,user_id", limit: "required|numeric", page: "required|numeric" };
    let { status, message } = await validate({ user_id, limit, page }, rules);
    if (!status) return response.failed(res, message);

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");

    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Posts.findAndCountAll({
            where: {
                [Sequelize.Op.or]: [
                    {
                        user_id: {
                            [Sequelize.Op.in]: Sequelize.literal(`
                            (SELECT followingId FROM follow WHERE followerId = ${user_id} AND status = 'accepted')
                        `)
                        }
                    },
                    {
                        '$user.public$': true
                    }
                ]
            },
            include: [
                {
                    model: Users,
                    as: "user",
                    attributes: ['username', 'user_id', 'name', 'profile_url', 'profile_img', 'public'],
                }
            ],
            attributes: {
                include: [
                    [literal(`(SELECT COUNT(*) FROM Likes WHERE Likes.postId = Posts.id)`), "likeCount"],
                    [literal(`(SELECT COUNT(*) > 0 FROM Likes WHERE Likes.postId = Posts.id AND Likes.user_id = ${user_id})`), "liked"],
                    [literal(`(SELECT COUNT(*) FROM comments WHERE comments.post_id = Posts.id)`), "commentCount"]
                ]
            },
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const totalPages = Math.ceil(count / limit);

        if (rows.length === 0) {
            return response.success(res, "No posts found!", []);
        }

        res.json({
            posts: rows,
            count,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.log("Error : " + error);
        response.serverError(res)
    }
};

exports.getPost = async (req, res) => {
    const { post_id } = req.params;
    const { user_id } = req.user;
    const rules = { post_id: "required|numeric|exist:Posts,id", user_id: "required|exist:users,user_id" };
    let { status, message } = await validate({ post_id, user_id }, rules);
    if (!status) return response.failed(res, message)

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");

try {
    let post = await Posts.findOne({
        where: { id: post_id },
        include: [
            {
                model: Users, as: "user", attributes: ['username', 'user_id', 'name', "profile_url", 'profile_img']
            }],
    });

    let liked = false;
    const like = await Like.findOne({
        where: {
            user_id,
            postId: post_id
        },
        attributes: ['id']
    });

    if (like) liked = true;

    const likeCount = await Like.count({ where: { postId: post_id } });
    res.json({ ...post.toJSON(), liked, likeCount });

} catch (error) {
console.log("\n\nError : " + error);
return response.serverError(res);
    
}

}

exports.addPost = async (req, res) => {
    const { caption = "", user_id } = req.body;

    const rules = { user_id: "required|exist:users,user_id" };
    let { status, message } = await validate({ user_id }, rules);
    if (!status) return response.failed(res, message);


    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");

    if (req.fileValidationError) {
        return response.failed(res, "Invalid file !", req.fileValidationError)
    } else if (!req.file || !user_id) {
        return response.failed(res, "Invalid file !")
    }

    let screenshotUrl = null;
    screenshotUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `posts/user_${user_id}`,
                public_id: `${user_id}_${Date.now()}`
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        uploadStream.end(req.file.buffer);
    });

    const post = Posts.create({ user_id, caption, image_path: screenshotUrl });
    return response.created(res, post)
}

exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.user;

    const rules = { id: "required|numeric|exist:Posts,id", user_id: "required|exist:users,user_id" };
    let { status, message } = await validate({ id, user_id }, rules);
    if (!status) return response.failed(res, message);

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");

    const post = await Posts.findOne({ where: { id, user_id }, attributes: ['image_path'] });
    if (!post) return response.failed(res, `No post found for user ${user_id} and post ${id}.`);

    const deletedRows = await Posts.destroy({ where: { id, user_id } });
    if (deletedRows === 0) {
        return response.failed(res, "Failed to delete the post.");
    }

    return response.success(res, "Successfully deleted the post.");
};

exports.addComment = async (req, res) => {
    const { post_id } = req.params;
    const { comment } = req.body;
    const { user_id } = req.user;

    const rules = {
        post_id: "required|numeric|exist:Posts,id",
        comment: "required|string",
        user_id: "required|exist:users,user_id"
    };

    let { status, message } = await validate({ post_id, comment, user_id }, rules);
    if (!status) return response.failed(res, message);

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");
    const data = await Comments.create({ user_id, post_id, content: comment });

    res.json(data);
}

exports.getComments = async (req, res) => {
    const { post_id } = req.params;
    const rules = {
        post_id: "required",
    };
    let { status, message } = await validate({ post_id }, rules);
    if (!status) return response.failed(res, message)

    const comments = await Comments.findAll({
        where: { post_id },
        include: [{ model: Users, as: "user", attributes: ['username', 'user_id', 'name', "profile_url", 'profile_img'] }],
        order: [
            ['id', 'DESC'],
        ],
    });
    if (comments.length < 1) {
        return response.failed(res, "No comments found !")
    }
    res.json(comments);
}

exports.setLikes = async (req, res) => {
    const { post_id } = req.params;
    const { user_id } = req.body;
    const rules = { post_id: "required", user_id: "required" };

    let { status, message } = await validate({ post_id, user_id }, rules);
    if (!status) return response.failed(res, message)

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");

    const existingLike = await Like.findOne({
        where: { user_id, postId: post_id, },
        attributes: ['id']
    });
    if (existingLike) {
        await existingLike.destroy();
        return response.success(res, "Successfully removed the like ➖")
    } else {
        const like = await Like.create({ user_id, postId: post_id, });
        return response.success(res, "Successfully added the like ➕", like)
    }
};

exports.editComment = async (req, res) => {
    const { comment_id } = req.params;
    const { content } = req.body;
    const rules = {
        content: "required",
        comment_id: "required",
    };
    let { status, message } = await validate({ comment_id, content }, rules);
    if (!status) return response.failed(res, message)

    await Comments.update({ content }, { where: { id: comment_id } });
    return response.success(res, "Successfully edited.")
}

exports.deleteComment = async (req, res) => {
    const { comment_id } = req.params;
    const rules = {
        comment_id: "required",
    };
    let { status, message } = await validate({ comment_id }, rules);
    if (!status) return response.failed(res, message)

    await Comments.destroy({ where: { id: comment_id } })
    return response.success(res, "Successfully Deleted.")
}