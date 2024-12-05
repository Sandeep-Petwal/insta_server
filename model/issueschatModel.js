const { DataTypes } = require("sequelize");
const sequelize = require("../database/database")



const Issueschat = sequelize.define('issueschat', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    issue_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'issues',
            key: 'id',
        },
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
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
},
    {
        timestamps: true
    }
);


module.exports = Issueschat