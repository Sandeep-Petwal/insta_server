const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");
// const Users = require("./userModel");
const moment = require('moment');

const Posts = sequelize.define("Posts", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // reference the User model
            key: 'user_id' // foreign key, rferencing user_id in the Users table
        },
        onDelete: 'CASCADE', // if id is deleted, their posts will be deleted
        onUpdate: 'CASCADE'  // if id is updated, then also cascade
    },
    image_path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image_url: {
        type: DataTypes.VIRTUAL,
        // get() {
        //     return `${process.env.SERVER_URL}/${this.image_path}`
        // }
        get() {
            return this.image_path
        }
    },
    caption: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
    },
    timeAgo: {
        type: DataTypes.VIRTUAL,
        get() {
            const now = moment();
            const createdAt = moment(this.createdAt);
            const duration = moment.duration(now.diff(createdAt));
            if (duration.days() > 0) {
                return `${ duration.days() } d`;
            } else if (duration.hours() > 0) {
                return `${ duration.hours() } hr`;
            } else if (duration.minutes() > 0) {
                return `${ duration.minutes() } min`;
            } else {
                return 'Just now';  
            }
        }
    }
}, {
    timestamps: true,
});


module.exports = Posts;
