const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");


const Templates = sequelize.define("Templates", {
    template_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    html: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: false
})

module.exports = Templates;