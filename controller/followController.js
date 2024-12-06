const Follow = require("../model/followModel.js");
const Users = require("../model/userModel.js")
const response = require("../util/response")
const validate = require('../util/validator');

// Follow request (pending)
exports.follow = async (req, res) => {
    const { followerId, followingId } = req.body;
    const rules = { followingId: "required|exist:users,user_id", followerId: "required|exist:users,user_id" }
    let { status, message } = await validate({ followerId, followingId }, rules);
    if (!status) return response.failed(res, "Invalid information.", message);


    if (req?.user?.user_id != followerId) return response.failed(res, "You dont have access.");

    const follow = await Follow.create({ followerId, followingId, status: "pending" })
    return res.json({ message: `User ${followerId} is following ${followingId} now.`, follow });
}

// Accept follow request
exports.acceptRequest = async (req, res) => {
    const { id } = req.body;
    const rules = { id: "required|numeric|exist:follow,id" }
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Invalid request ID.", message)

    const acceptFollow = await Follow.update({ status: "accepted" }, { where: { id } })
    return res.json({ message: `Request Accepted.`, acceptFollow });
}

// Reject follow request
exports.deleteRequest = async (req, res) => {
    const { id } = req.body;
    const rules = { id: "required|numeric|exist:follow,id" }
    let { status, message } = await validate({ id }, rules);
    if (!status) return response.failed(res, "Invalid request ID.", message)

    await Follow.destroy({ where: { id } })
    return res.json({ message: `Request rejected.` });
}

// Unfollow
exports.unfollow = async (req, res) => {
    const { followerId, followingId } = req.body;
    const rules = { followingId: "required|exist:users,user_id", followerId: "required|exist:users,user_id" }
    let { status, message } = await validate({ followerId, followingId }, rules);
    if (!status) return response.failed(res, "Invalid information.", message)

    if (req?.user?.user_id != followerId) return response.failed(res, "You dont have access."); 

    await Follow.destroy({ where: { followerId, followingId } })
    return res.json({ message: `User ${followerId} is unfollowing ${followingId} now.` });
}

// Get follow requests
exports.getFollowrequests = async (req, res) => {

    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    if (!user_id) return response.failed(res, "Invalid user id !");
    const offset = (page - 1) * limit;

    const { count, rows } = await Follow.findAndCountAll({
        where: { followingId: user_id, status: 'pending' },
        attributes: {
            exclude: ['updatedAt']
        },
        include: [
            {
                model: Users,
                as: 'follower', 
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
}

// Get followers list
exports.getFollowers = async (req, res) => {

    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    if (!user_id) return response.failed(res, "Invalid user id !");
    const offset = (page - 1) * limit;

    const { count, rows } = await Follow.findAndCountAll({
        where: { followingId: user_id, status: 'accepted' },
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        include: [
            {
                model: Users,
                as: 'follower', 
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
}

// Get following list
exports.getFollowing = async (req, res) => {
    console.log("Inside getFollowing");
    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    if (!user_id) return response.failed(res, "Invalid user id !");
    const offset = (page - 1) * limit;

    const { count, rows } = await Follow.findAndCountAll({
        where: { followerId: user_id, status: 'accepted' },
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        include: [
            {
                model: Users,
                as: 'following',
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
}