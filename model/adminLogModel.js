const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const AdminLog = sequelize.define(
    "adminlog",
    {
        log_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        admin_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        route: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        method: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ip_address: {
            type: DataTypes.STRING,
        },
        user_agent: {
            type: DataTypes.STRING,
        },
        request_body: {
            type: DataTypes.TEXT,
        },
        response_body: {
            type: DataTypes.TEXT,
        },
        status_code: {
            type: DataTypes.INTEGER,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    },
    {
        tableName: "adminlog",
        timestamps: false,
    }
);

module.exports = AdminLog;