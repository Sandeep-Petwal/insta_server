const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
// const Users = require('./userModel');

const Notification = sequelize.define('notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_id: { // user who will recive the notification
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    type: {
        type: DataTypes.ENUM('like', 'comment', 'follow'),
        allowNull: false
    },
    source_id: { // user_id if it is follow . post id if it is like or comment
        type: DataTypes.INTEGER,
        allowNull: false
    },

    target_user: { // user who did the action
        type: DataTypes.INTEGER,
        allowNull: false
    },

    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: true
});


module.exports = Notification;
