const { DataTypes } = require("sequelize");
const sequelize = require("../database/database")
const Sequelize = require('sequelize')
// const Posts = require("./postModel")

const Users = sequelize.define("users", {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    profile_img: {
        type: DataTypes.STRING,
        defaultValue: "https://res.cloudinary.com/dnjvjpbws/image/upload/v1733307332/profile_knhmyu.jpg",
    },
    profile_url: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.profile_img
        }
        // get() {
        //     return `${process.env.SERVER_URL}/${this.profile_img}`
        // }
    },
    bio: {
        type: DataTypes.STRING,
        defaultValue: ""
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    otp: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    login_count: {
        type: DataTypes.INTEGER, defaultValue: 0
    },
    two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'blocked', 'deleted'),
        defaultValue: 'active'
    },
    deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
    },
    role: {
        type: DataTypes.ENUM,
        values: ['user', 'admin'],
        defaultValue: 'user',
    },
}, {
    timestamps: true,
});



module.exports = Users