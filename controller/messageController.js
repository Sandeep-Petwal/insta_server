const Messages = require("../model/messagesModel")
const Users = require("../model/userModel")
const { Op, where } = require('sequelize');
const response = require("../util/response")
const validate = require('../util/validator');
const Sequelize = require('sequelize')
const { literal } = require('sequelize');


// TODO: Specific user only
exports.getAllUsers = async (req, res) => {
    console.log("Inside getAllusers for chat : ");
    const { user_id, limit = 10, page = 1 } = req.query;
    console.table({ user_id, limit, page })
    const offset = (page - 1) * limit;

    // if requested user is not the user from token
    const token_user_id = req?.user?.user_id;
    if (token_user_id != user_id) return response.failed(res, "You dont have access.");




    const rules = { user_id: "required|integer", limit: "required|integer", page: "required|integer" };
    let { status, message } = await validate({ user_id, limit, page }, rules);
    if (!status) return response.failed(res, "Provide correct information.", message);

    try {
        const { count, rows } = await Users.findAndCountAll({
            where: {
                [Op.or]: [
                    {
                        user_id: {
                            [Sequelize.Op.in]: Sequelize.literal(`
                                (SELECT followingId FROM follow WHERE followerId = ${user_id} AND status = 'accepted')
                            `)
                        }
                    },
                    {
                        user_id: {
                            [Sequelize.Op.in]: Sequelize.literal(`
                                (SELECT followerId FROM follow WHERE followingId = ${user_id} AND status = 'accepted')
                            `)
                        }
                    },
                    {
                        public: true
                    }
                ]
            },
            attributes: {
                exclude: ['password', 'createdAt', 'updatedAt', 'otp', 'email', 'two_factor_enabled', 'two_factor_secret', 'login_count']
            },
            order: [['user_id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const totalPages = Math.ceil(count / limit);

        if (rows.length === 0) {
            return response.noContent(res, "No users found!");
        }

        res.json({
            users: rows,
            count,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error(error);
        return response.serverError(res, "Error fetching users");
    }
};





// store messages
exports.storeMessage = async (sender_id, receiver_id, text) => {
    console.log("Inside storeMessage");
    try {
        const message = await Messages.create({ sender_id, receiver_id, text });
        // console.table(message);
    } catch (error) {
        console.log("Error while storing message to db !", error);
    }
}

// delete message by its id
exports.deleteMessage = async (req, res) => {
    const { id } = req.params
    if (!id) return response.failed(res, "Id not provided")


    try {
        const deletedCount = await Messages.destroy({ where: { id } });
        if (deletedCount === 0) {
            console.log('No Message found with that ID.');
            return response.failed(res, "No Message found with id")
        }
        return response.success(res, "Message Deleted")
    } catch (error) {
        console.log(error);
        return response.serverError(res, error)
    }
}

// Edit message by its id
exports.editMessage = async (req, res) => {
    const { id } = req.params;
    const { text, user_id } = req.body;

    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");    // if requested user is not token user


    const rules = {
        text: "required|string",
        id: "required|integer"
    }
    let { status, message } = await validate({ text, id }, rules);
    if (!status) return response.failed(res, "Provide currect information.", message)

    try {
        const [affectedCount] = await Messages.update({ text }, { where: { id } });
        if (affectedCount === 0) {
            console.log('No Message found with that ID.');
            return response.failed(res, "No Message found with that ID");
        }
        return response.success(res, "Message Edited");
    } catch (error) {
        console.error(error);
        return response.serverError(res, error);
    }
}


exports.getConversation = async (req, res) => {
    const { sender: sender_id, receiver: receiver_id } = req.query;

    // if requested user is not the user from token
    const token_user_id = req?.user?.user_id;
    if (token_user_id != receiver_id) return response.failed(res, "You dont have access.");

    const rules = {
        sender_id: "required|integer",
        receiver_id: "required|integer"
    }
    let { status, message } = await validate({ sender_id, receiver_id }, rules);
    if (!status) return response.failed(res, "Provide currect information.", message)


    try {
        const messages = await Messages.findAll({
            where: {
                [Op.or]: [
                    { sender_id, receiver_id },
                    { sender_id: receiver_id, receiver_id: sender_id }
                ]
            },
            order: [['createdAt', 'ASC']] // latest message last
        });

        if (messages.length > 0) {
            return res.json({ data: messages })
        }
        res.json({ message: "No conversation found", data: [] })
    } catch (error) {
        console.log(error);
        return response.serverError(res, error)
    }
};
