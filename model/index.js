const Users = require("./userModel");
const Posts = require("./postModel");
const Comments = require("./commentModel");
const Follow = require("./followModel");
const Like = require("./likeModel");
const Templates = require("./templateModel");
const Tempusers = require("./tempUserModel");
const Notification = require("./notificationModel");
const Messages = require("./messagesModel");
const Session = require("./sessionModal");
const AdminLog = require("./adminLogModel");
const Issues = require("./issuesModel");
const Issueschat = require("./issuesChatModel");

const sequelize = require("../database/database");

Users.hasMany(Posts, { foreignKey: "user_id" }); //  user can have many posts
Posts.belongsTo(Users, { foreignKey: "user_id" }); //  post belongs to one user

Users.hasMany(Comments, { foreignKey: "user_id" }); //  user can have many comments
Comments.belongsTo(Users, { foreignKey: "user_id" }); //  comment belongs to one user

Posts.hasMany(Comments, { foreignKey: "post_id" }); //  post can have many comments
Comments.belongsTo(Posts, { foreignKey: "post_id" }); //  comment belongs to one post

Users.hasMany(Like, { foreignKey: "user_id" }); //  user can like many posts
Like.belongsTo(Users, { foreignKey: "user_id" }); //  like belongs to one user

Posts.hasMany(Like, { as: "likes", foreignKey: "post_id" });
Like.belongsTo(Posts, { foreignKey: "post_id" });

Users.hasMany(Follow, { foreignKey: "followerId", as: "follower" });
Follow.belongsTo(Users, { foreignKey: "followerId", as: "follower" }); // user can have many followers

Users.hasMany(Follow, { foreignKey: "followingId", as: "following" });
Follow.belongsTo(Users, { foreignKey: "followingId", as: "following" }); // user can have many people they are following

Notification.belongsTo(Users, { foreignKey: "user_id", as: "user" });



// ***************** Support Tickets ***************** //
// A user can raise many issues
Users.hasMany(Issues, { foreignKey: 'user_id', as: 'issues' });
Issues.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });

// An issue can have many chats
Issues.hasMany(Issueschat, { foreignKey: 'issue_id', as: 'chats' });
Issueschat.belongsTo(Issues, { foreignKey: 'issue_id', as: 'issue' });

// A chat is sent by a user
Users.hasMany(Issueschat, { foreignKey: 'sender_id', as: 'chats' });
Issueschat.belongsTo(Users, { foreignKey: 'sender_id', as: 'sender' });

// A chat is received by a user
Users.hasMany(Issueschat, { foreignKey: 'receiver_id', as: 'receivedChats' });
Issueschat.belongsTo(Users, { foreignKey: 'receiver_id', as: 'receiver' });



Session.belongsTo(Users, { foreignKey: "user_id", as: "user" });


sequelize.sync({force : true})
    .then(() => console.log("Models sync success"))
    .catch((err) => console.log("Error sync Models " + err))

// Posts.sync({ alter: true })
//   .then(() => console.log("Models sync success"))
//   .catch((err) => console.log("Error sync Models " + err));

// Session.sync({ alter: true })
//   .then(() => console.log("Models sync success"))
//   .catch((err) => console.log("Error sync Models " + err));

module.exports = {
  Users,
  Posts,
  Comments,
  Follow,
  Like,
  Templates,
  Tempusers,
  Notification,
  Messages,
  Session,
  AdminLog,
  Issues,
  Issueschat
};
