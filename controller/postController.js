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


// http://localhost:3005/api/post/get?user_id=1, feed , all posts
exports.getPosts = async (req, res) => {
    console.log("Inside getPosts");
    const { user_id, limit = 10, page = 1 } = req.query;

    if (!user_id) {
        return response.failed(res, "Invalid user id !");
    }

    const offset = (page - 1) * limit;

    try {
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
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error fetching posts");
    }
};

// 
exports.customizedFeed = async (req, res) => {
    console.log("Inside getPosts");
    const { user_id, limit = 10, page = 1 } = req.query;

    if (!user_id) {
        return response.failed(res, "Invalid user id!");
    }

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");    // if requested user is not token user


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
                    [literal(`(SELECT COUNT(*) FROM Comments WHERE Comments.post_id = Posts.id)`), "commentCount"]
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
        console.error(error);
        return response.serverError(res, "Error fetching posts");
    }
};




// a single post
exports.getPost = async (req, res) => {
    console.log("Inside get Post");
    const { post_id } = req.params;
    const { user_id } = req.user; // from auth middleware
    const rules = { post_id: "required", user_id: "required" };
    let { status, message } = await validate({ post_id, user_id }, rules);
    if (!status) return response.failed(res, message)

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");    // if requested user is not token user

    try {
        let post = await Posts.findOne({
            where: { id: post_id },
            include: [
                {
                    model: Users, as: "user", attributes: ['username', 'user_id', 'name', "profile_url", 'profile_img']
                }],
        });

        // check if post is liked
        let liked = false;
        const like = await Like.findOne({
            where: {
                user_id,
                postId: post_id
            },
            attributes: ['id']
        });

        if (like) liked = true;

        //get the totle number of likes
        const likeCount = await Like.count({ where: { postId: post_id } });
        if (post == null || post.length < 1) {
            return response.failed(res, "No posts found !")
        }
        // res.json({ ...post.toJSON(), liked, likeCount });
        res.json({ ...post.toJSON(), liked, likeCount });
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error fetching Post")
    }
}

// http://localhost:3005/api/post/add
exports.addPost = async (req, res) => {
    console.log("inside add post");
    const { caption = "", user_id } = req.body;

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");    // if requested user is not token user


    if (req.fileValidationError) {
        return response.failed(res, "Invalid file !", req.fileValidationError)
    } else if (!req.file || !user_id) {
        return response.failed(res, "Invalid file !")
    }




    try {

        let screenshotUrl = null;
        screenshotUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `posts/user_${user_id}`,
                    public_id: `${user_id}_${Date.now()}`
                }, // Optional folder for organization
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url); // Cloudinary's URL
                }
            );
            uploadStream.end(req.file.buffer); // Pipe file buffer to Cloudinary
        });




        const post = Posts.create({ user_id, caption, image_path: screenshotUrl });
        return response.created(res, post)
    } catch (error) {
        console.error("Error updating the User: ", error);
        return response.serverError(res);
    }
}


// Deleting the Post :: http://localhost:3005/api/post/delete/12
exports.deletePost = async (req, res) => {
    console.log("inside deletePost ::");
    const { id } = req.params;
    const { user_id } = req.user;

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");    // if requested user is not token user


    const rules = { id: "required|numeric", user_id: "required" };
    let { status, message } = await validate({ id, user_id }, rules);
    if (!status) return response.failed(res, message);

    try {
        // get the post &  image path
        const post = await Posts.findOne({ where: { id, user_id }, attributes: ['image_path'] });
        if (!post) return response.failed(res, `No post found for user ${user_id} and post ${id}.`);

        // remove post
        const deletedRows = await Posts.destroy({ where: { id, user_id } });
        if (deletedRows === 0) {
            return response.failed(res, "Failed to delete the post.");
        }

        // also remove post image
        if (post.image_path) {
            const imagePath = path.join(__dirname, '../', post.image_path);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("error deleting post image:", err);
                else console.log("Post image deleted successfully");
            });
        }
        return response.success(res, "Successfully deleted the post.");
    } catch (error) {
        console.error("Error deleting the post:", error);
        return response.serverError(res);
    }
};


exports.addComment = async (req, res) => {
    console.log("Inside add comments");

    const { post_id } = req.params;
    const { comment } = req.body;
    const { user_id } = req.user

    const rules = {
        post_id: "required",
        comment: "required|string",
        user_id: "required"
    };

    let { status, message } = await validate({ post_id, comment, user_id }, rules);
    if (!status) return response.failed(res, message)

    try {
        const data = await Comments.create({ user_id, post_id, content: comment });

        res.json(data);
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error adding comment")
    }
}

exports.getComments = async (req, res) => {
    console.log("Inside get comments");
    const { post_id } = req.params;
    const rules = {
        post_id: "required",
    };
    let { status, message } = await validate({ post_id }, rules);
    if (!status) return response.failed(res, message)
    try {
        const comments = await Comments.findAll({
            where: { post_id },
            include: [{ model: Users, as: "user", attributes: ['username', 'user_id', 'name', "profile_url", 'profile_img'] }],
            order: [
                ['id', 'DESC'], //descending order
            ],
        });
        if (comments.length < 1) {
            return response.failed(res, "No comments found !")
        }
        res.json(comments);
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error adding comment")
    }
}

// Controller for setting or removing a like
exports.setLikes = async (req, res) => {
    console.log("\nInside :: setLikes\n");
    const { post_id } = req.params;
    const { user_id } = req.body;
    const rules = { post_id: "required", user_id: "required" };

    let { status, message } = await validate({ post_id, user_id }, rules);
    if (!status) return response.failed(res, message)


    try {
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
    } catch (error) {
        console.error("Error while toggling like: ", error);
        return response.failed(res, "Error while toggling like", error.message)
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


    try {
        await Comments.update({ content }, { where: { id: comment_id } });
        return response.success(res, "Successfully edited.")
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error adding comment")
    }
}

exports.deleteComment = async (req, res) => {
    const { comment_id } = req.params;
    const rules = {
        comment_id: "required",
    };
    let { status, message } = await validate({ comment_id }, rules);
    if (!status) return response.failed(res, message)


    try {
        await Comments.destroy({ where: { id: comment_id } })
        return response.success(res, "Successfully Deleted.")
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error adding comment")
    }
}