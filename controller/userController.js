var jwt = require("jsonwebtoken");
const response = require("../util/response.js");
const secret = process.env.SECRET_KEY;
const bcrypt = require("bcrypt");
const validate = require("../util/validator");
const { literal, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cloudinary = require('../config/cloudinaryConfig.js');
const sequelize = require("../database/database.js");

// const fs = require('fs')
const fs = require("fs").promises;
const {
  Users,
  Posts,
  Comments,
  Like,
  Follow,
  Session,
} = require("../model/index.js");


exports.logIn = async (req, res) => {
  const {
    email,
    password,
    ipAddress = "not provided",
  } = req.body;
  const rules = {
    email: "required|email|exist:users,email",
    password: "required|min:3",
  };
  const { status, message } = await validate({ email, password }, rules);
  if (!status) return response.failed(res, "Invalid information.", message);

  const user = await Users.findOne({
    where: { email: email, status: "active" },
  });

  if (!user) return response.failed(res, "Not found.", "user not found.");

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) return response.failed(res, "Invalid username or password");

  // check if 2fa enabled
  if (user.two_factor_enabled) return response.success(res, "Verify TOTP", { two_factor_enabled: true });
  user.login_count += 1;
  await user.save();

  const session_id = uuidv4();
  await Session.create({
    session_id,
    user_id: user.user_id,
    userAgent: req.headers['user-agent'] || "unknown",
    ip: ipAddress,
  });

  const { user_id, name, username } = user;
  const token = jwt.sign(
    { user_id, name, email: user.email, username, session_id },
    secret,
    { expiresIn: "1d" }
  );



  return res.json({
    message: "Login successful",
    token,
    two_factor_enabled: false,
  });
};

// logout
exports.logOut = async (req, res) => {
  const { session_id } = req.user;
  const rules = { session_id: "required|exist:sessions,session_id" };
  const { status, message } = await validate({ session_id }, rules);
  if (!status) return response.failed(res, message);

  const deletedCount = await Session.destroy({ where: { session_id } });
  return response.success(res, "Logout successful", deletedCount);
};

// get all sessions
exports.getSessions = async (req, res) => {
  const user_id = req.user?.user_id;

  const rules = {
    user_id: "required|exist:users,user_id",
  };
  let { status, message } = await validate({ user_id }, rules);
  if (!status) return response.failed(res, message);

  let sessions = await Session.findAll({
    where: { user_id },
    order: [["createdAt", "DESC"]],
  });

  // if sessions availble then find the current session from user.session_id and add field current to true
  if (sessions.length > 0) {
    const currentSessionId = req.user.session_id;
    sessions = sessions.map(session => ({
      ...session.toJSON(),
      current: session.session_id === currentSessionId
    }));
  }

  return response.success(res, "Sessions found", sessions);
};



// delete a particular session
exports.deleteSession = async (req, res) => {
  const { session_id } = req?.params;

  const rules = {
    session_id: "required|exist:sessions,session_id",
  };
  const { status, message } = await validate({ session_id }, rules);
  if (!status) return response.failed(res, message);

  const deletedCount = await Session.destroy({ where: { session_id } });
  if (deletedCount === 0) return response.failed(res, "No session found with id");
  return response.success(res, "Session Deleted");
};

// delete all sessions axcept current session
exports.deleteAllSessions = async (req, res) => {
  const current_session_id = req?.user?.session_id;
  const { user_id } = req?.user;

  const rules = { current_session_id: "required", user_id: "required|exist:users,user_id" };
  const { status, message } = await validate({ current_session_id, user_id }, rules);
  if (!status) return response.failed(res, message);

  const deletedCount = await Session.destroy({
    where: {
      user_id,
      session_id: {
        [Op.ne]: current_session_id
      }
    }
  });

  if (deletedCount === 0) return response.success(res, "No other sessions to delete");

  return response.success(res, `Successfully deleted ${deletedCount} session(s)`);
};

exports.getUser = async (req, res) => {
  let { user_id } = req.params;
  let loggedInUser = req.user.user_id;

  const rules = { user_id: "required|exist:users,user_id" };
  let { status, message } = await validate({ user_id }, rules);
  if (!status) return response.failed(res, message);

  try {
    const user = await Users.findOne({
      where: { user_id },
      attributes: {
        exclude: ["password", "otp", "two_factor_secret"],
        include: [
          [
            literal(
              `(SELECT COUNT(*) FROM Posts WHERE Posts.user_id = users.user_id)`
            ),
            "posts",
          ],
          [
            literal(
              '(SELECT COUNT(*) FROM follow WHERE follow.followingId = users.user_id AND follow.status = "accepted")'
            ),
            "followers",
          ],
          [
            literal(
              '(SELECT COUNT(*) FROM follow WHERE follow.followerId = users.user_id AND follow.status = "accepted")'
            ),
            "following",
          ],
          [
            literal(
              `COALESCE((SELECT status FROM follow WHERE follow.followerId = ${loggedInUser} AND follow.followingId = ${user_id}), 'none')`
            ),
            "status",
          ],
        ],
      },
    });
    return response.success(res, "User found", user);
  } catch (error) {
    console.log("\n\nError : " + error);
    return response.serverError(res);
  }



};



exports.getUserPosts = async (req, res) => {
  console.log("Inside getUserPosts");
  const { user_id, limit = 10, page = 1 } = req.query;

  const rules = { user_id: "required|exist:users,user_id" };
  let { status, message } = await validate({ user_id }, rules);
  if (!status) return response.failed(res, message);

  const offset = (page - 1) * limit;

  const { count, rows } = await Posts.findAndCountAll({
    where: { user_id },
    order: [
      ["id", "DESC"], //descending order
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  const totalPages = Math.ceil(count / limit);
  if (rows.length === 0) {
    return response.failed(res, "No posts found");
  }
  res.json({
    posts: rows,
    count,
    totalPages,
    currentPage: parseInt(page),
  });

};

exports.editProfile = async (req, res) => {
  console.log("inside edit profile");
  const { user_id } = req.params;
  const { name, username, bio, public } = req.body;

  const rules = {
    user_id: "required|exist:users,user_id",
    name: "required",
    username: "required",
    public: "required",
  };
  let { status, message } = await validate(
    { user_id, name, username, bio, public },
    rules
  );
  if (!status) return response.failed(res, message);
  if (req?.user?.user_id != user_id)
    return response.failed(res, "You dont have access."); // if requested user is not token user

  if (req.fileValidationError) {
    console.log(req.fileValidationError);
    return response.failed(res, "Invalid image!", req.fileValidationError);
  }

  const user = await Users.findOne({
    where: { user_id },
    attributes: ["profile_img"],
  });
  if (!user) return response.failed(res, "User not found!");

  let updatedData = { name, bio, username, public };

  let profileImg = null;
  profileImg = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `posts/user_${user_id}`,
        public_id: `Profile_${user_id}_${Date.now()}`
      }, // Optional folder for organization
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Cloudinary's URL
      }
    );
    uploadStream.end(req.file.buffer); // Pipe file buffer to Cloudinary
  });

  if (profileImg) updatedData.profile_img = profileImg;

  const updatedUser = await Users.update(updatedData, { where: { user_id } });

  return response.created(res, updatedUser, "User profile updated successfully.");
};



// search user
exports.searchUsers = async (req, res) => {
  const { limit = 10, page = 1, value } = req.query;

  let { status, message } = await validate(
    { value },
    { value: "required|string" }
  );
  if (!status) return response.failed(res, message);
  const offset = (page - 1) * limit;

  const users = await Users.findAll({
    where: {
      name: {
        [Op.like]: `%${value}%`,
      },
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: {
      exclude: [
        "password",
        "public",
        "otp",
        "email",
        "two_factor_enabled",
        "two_factor_secret",
        "login_count",
      ],
    },
  });

  if (users && users.length > 0) {
    res.json(users);
  } else {
    return response.failed(res, "No users found");
  }
};

//  delete a file
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting file ::  ${filePath}`);
    throw new Error("Error deleting: " + filePath);
  }
}

async function deleteUserAccountUnmanaged(user_id, user) {
  const t = await sequelize.transaction();

  try {
    const userPosts = await Posts.findAll({
      where: { user_id },
      attributes: ["image_path"],
      transaction: t,
    });

    // delete all from image_path
    await Promise.all(
      userPosts.map((post) => {
        if (post.imagePath) {
          const fullPath = path.join(__dirname, "../", post.imagePath);
          return deleteFile(fullPath);
        }
        return Promise.resolve(true);
      })
    );

    // also delete the profile image if not == "uploads/profile.jpeg"
    const dp = path.join(__dirname, "../", user.profile_img);
    if (user.profile_img != "uploads/profile.jpeg") {
      console.log("Deleting profile image :: " + dp);
      await deleteFile(dp);
    }
    // delete related data
    await Promise.all([
      Like.destroy({ where: { user_id }, transaction: t }),
      Comments.destroy({ where: { user_id }, transaction: t }),
      Follow.destroy({
        where: {
          [Op.or]: [{ followerId: user_id }, { followingId: user_id }],
        },
        transaction: t,
      }),
      Posts.destroy({ where: { user_id }, transaction: t }),
    ]);

    // delete user
    await Users.destroy({
      where: { user_id },
      transaction: t,
    });

    // Commit transaction
    await t.commit();
    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    // rollback transaction ::  error
    await t.rollback();
    console.error("Error in deleteUserAccount:", error);
    return { success: false, message: "Failed to delete account", error };
  }
}

// permanently delete user
// TODO: delete everything associated to that user , post, comments, likes, followers, following and post images and profile image as well
// exports.deleteAccount = async (req, res) => {
//   const { user_id } = req.params;
//   const { password, TOTP = 0 } = req.body;

//   const rules = {
//     password: "required",
//     user_id: "required",
//     user_id: "required",
//   };
//   let { status, message } = await validate(
//     { password, user_id, user_id },
//     rules
//   );
//   if (!status) return response.failed(res, "Invalid details !", message);

//   if (req?.user?.user_id != user_id)
//     return response.failed(res, "You dont have access."); // if requested user is not token user

//   try {
//     // find user
//     const user = await Users.findOne({ where: { user_id } });
//     if (!user)
//       return response.failed(
//         res,
//         "Provide currect information !",
//         "User with this email not found!"
//       );

//     // match password
//     const isPasswordMatch = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatch)
//       return response.failed(
//         res,
//         "Invalid password !",
//         "Invalid email or password!"
//       );

//     if (user.two_factor_enabled) {
//       // two fector is enabled // verify the TOTP
//       const isVerified = speakeasy.totp.verify({
//         secret: user.two_factor_secret,
//         encoding: "base32",
//         token: TOTP,
//       });

//       if (!isVerified) return response.failed(res, "Invalid TOTP");
//     }

//     // const result = await deleteUserAccount(user.user_id);
//     const result = await deleteUserAccountUnmanaged(user.user_id, user);
//     if (result.success) {
//       return response.success(res, "User deleted !");
//     } else {
//       res.status(500).json({ error: result.message });
//     }
//   } catch (error) {
//     console.log("\nerror in Deleting user: \n" + error);
//     return response.serverError(res);
//   }
// };


exports.softDelete = async (req, res) => {
  const { user_id } = req.params;
  const { status = "deleted" } = req.body;

  const rules = { user_id: "required|numeric|exist:users,user_id", status: "required|in:active,blocked,deleted" };
  let { status: valid, message } = await validate({ user_id, status }, rules);
  if (!valid) return response.failed(res, "Invalid details !", message);

  const user = await Users.findByPk(user_id);
  if (!user) return response.failed(res, "Invalid information!", "User not found!");
  if (user.role === "admin") return response.failed(res, "Can't change admin status!", "Can't block or delete admin!");

  if (status === "deleted") {
    if (user.status !== "deleted") {
      user.deletedAt = new Date();
      user.status = "deleted";  // Mark as deleted
      await user.save();
      return response.success(res, "User deleted successfully");
    } else {
      return response.failed(res, "User is already deleted.", "No action needed.");
    }
  }

  user.status = status;
  user.deletedAt = null;
  await user.save();
  return response.success(res, `User status changed to ${status}`);

};

