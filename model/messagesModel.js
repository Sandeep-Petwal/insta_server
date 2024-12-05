const { DataTypes } = require("sequelize");
const sequelize = require("../database/database")

const Messages = sequelize.define("messages", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id',
        },
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id',
        },
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    timestamps: true,
});


module.exports = Messages