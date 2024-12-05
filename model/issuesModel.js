const { DataTypes } = require("sequelize");
const sequelize = require("../database/database")

const Issues = sequelize.define('issues', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id',
        },
    },
    type: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    resolve_message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    screenshotUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    state: {
        type: DataTypes.ENUM('Pending', 'in_progress', 'Resolved'),
        defaultValue: 'Pending',
    },
}, {
    timestamps: true,
});


module.exports = Issues
