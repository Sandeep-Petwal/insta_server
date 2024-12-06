const Notification = require("../model/notificationModel")
const validate = require('../util/validator');
const response = require("../util/response")
const { literal } = require('sequelize');
const sequelize = require("../database/database");

exports.addNotification = async (user_id, type, source_id, target_user) => {
    const rules = { user_id: "required", type: "required", source_id: "required", target_user: "required" };
    let { status, message } = await validate({ user_id, type, source_id, target_user }, rules);
    if (!status) return response.failed(res, message);

    await Notification.create({ user_id, type, source_id, target_user });
}

exports.getUnreadCount = async (req, res) => {
    const { user_id } = req.params;
    let { status, message } = await validate({ user_id }, { user_id: "required|integer" });
    if (!status) return response.failed(res, message);

    const unreadCount = await Notification.count({ where: { user_id: user_id, isRead: false } });
    return response.success(res, "Success getting count of unread notifications", { unreadCount });
};

exports.markAllNotificationsAsRead = async (req, res) => {
    const { user_id } = req.params;
    let { status, message } = await validate({ user_id }, { user_id: "required|integer" });
    if (!status) return response.failed(res, message);

    const [updatedCount] = await Notification.update(
        { isRead: true },
        {
            where: {
                user_id: user_id,
                isRead: false,
            }
        });

    if (updatedCount === 0) return response.success(res, "No unread notification to mark read.", [])
    return response.success(res, `${updatedCount} notification(s) marked as read.`, [])
};

exports.getNotificaton = async (req, res) => {
    const { limit = 10, page = 1 } = req.query;
    const { user_id } = req.params;

    let { status, message } = await validate({ user_id }, { user_id: "required|exist:users,user_id" });
    if (!status) return response.failed(res, message);
    if (req?.user?.user_id != user_id) return response.failed(res, "You dont have access.");

    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
        where: { user_id },
        order: [['id', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: {
            include: [
                [
                    sequelize.literal(`
                      (SELECT username FROM users WHERE users.user_id = notification.target_user)`),
                    'target_username'
                ],
            ],
        },
    });

    const unreadCount = await sequelize.query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND isRead = 0`, {
        replacements: { user_id },
        type: sequelize.QueryTypes.SELECT
    });

    const responseToSend = {
        notifications: rows,
        count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(offset) / parseInt(limit) + 1,
        unread: unreadCount[0]['COUNT(*)'],
    };

    if (rows.length === 0) return response.failed(res, "No notification found")

    await Notification.update(
        { isRead: true },
        {
            where: {
                user_id: user_id,
                isRead: false,
            }
        });

    res.json(responseToSend);
}