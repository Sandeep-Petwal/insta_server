// const { Users, Posts, Follow } = require("../model/index.js");
const Follow = require("../model/followModel.js");
const Users = require("../model/userModel.js")
const response = require("../util/response")
const validate = require('../util/validator');



// follow :: pending ..... 
exports.follow = async (req, res) => {
    const { followerId, followingId } = req.body;
    const rules = { followingId: "required", followerId: "required" }
    let { status, message } = await validate({ followerId, followingId }, rules);
    if (!status) return response.failed(res, "Invalid information.", message);

    try {
        const follow = await Follow.create({ followerId, followingId, status: "pending" })
        return res.json({ message: `User ${followerId} is following ${followingId} now.`, follow });
    } catch (error) {
        console.log(error);
        return response.serverError(res, error)
    }
}

// accept the request 
exports.acceptRequest = async (req, res) => {
    const { id } = req.body;
    const rules = { id: "required|numeric" }
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Invalid request ID.", message)

    try {
        const acceptFollow = await Follow.update({ status: "accepted" }, { where: { id } })
        return res.json({ message: `Request Accepted.`, acceptFollow });
    } catch (error) {
        console.log(error);
        return response.serverError(res, error)
    }
}

// reject request
exports.deleteRequest = async (req, res) => {
    const { id } = req.body;
    const rules = { id: "required|numeric" }
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Invalid request ID.", message)

    try {
        await Follow.destroy({ where: { id } })
        return res.json({ message: `Request rejected.` });
    } catch (error) {
        console.log(error);
        return response.serverError(res, error)
    }
}


// follow
exports.unfollow = async (req, res) => {
    const { followerId, followingId } = req.body;
    const rules = { followingId: "required", followerId: "required" }
    let { status, message } = await validate({ followerId, followingId }, rules);
    if (!status) return response.failed(res, "Invalid information.", message)

    try {
        await Follow.destroy({ where: { followerId, followingId } })
        return res.json({ message: `User ${followerId} is unfollowing ${followingId} now.` });
    } catch (error) {
        console.log(error);
        return response.serverError(res, error)
    }
}

// get follow request
exports.getFollowrequests = async (req, res) => {
    console.log("Inside getFollowrequests ::: ");

    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    if (!user_id) return response.failed(res, "Invalid user id !");
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Follow.findAndCountAll({
            where: { followingId: user_id, status: 'pending' },
            attributes: {
                exclude: ['updatedAt']
            },
            include: [
                {
                    model: Users,
                    as: 'follower',   // impo 'follower' is correctly associated with followerId
                    attributes: ['user_id', 'username', 'name', 'profile_url', 'profile_img']
                }
            ],
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });


        const totalPages = Math.ceil(count / limit);
        if (rows.length === 0) {
            return response.success(res, "No request's found !", rows);
        }

        res.json({
            users: rows,
            count,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error fetching requests.");
    }

}

// get the list of followers
exports.getFollowers = async (req, res) => {
    console.log("Inside getFollowers ::: ");

    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    if (!user_id) return response.failed(res, "Invalid user id !");
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Follow.findAndCountAll({
            where: { followingId: user_id, status: 'accepted' },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            include: [
                {
                    model: Users,
                    as: 'follower',   // impo 'follower' is correctly associated with followerId
                    attributes: ['user_id', 'username', 'name', 'profile_url', 'profile_img']
                }
            ],
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });


        const totalPages = Math.ceil(count / limit);
        if (rows.length === 0) {
            return response.success(res, "No follower's found !", rows);
        }

        res.json({
            users: rows,
            count,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error fetching followers.");
    }

}

// get the list of following
exports.getFollowing = async (req, res) => {
    console.log("Inside getFollowing");
    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    if (!user_id) return response.failed(res, "Invalid user id !");
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await Follow.findAndCountAll({
            where: { followerId: user_id, status: 'accepted' },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            include: [
                {
                    model: Users,
                    as: 'following',   // impo 'following' is correctly associated with followingId
                    attributes: ['user_id', 'username', 'name', 'profile_url', 'profile_img']
                }
            ],
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });


        const totalPages = Math.ceil(count / limit);
        if (rows.length === 0) {
            return response.success(res, "No following's found !", rows);
        }

        res.json({
            users: rows,
            count,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error fetching following.");
    }

}