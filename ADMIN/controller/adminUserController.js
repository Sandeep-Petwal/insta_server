var jwt = require('jsonwebtoken');
const response = require("../../util/response")
const secret = process.env.SECRET_KEY
const speakeasy = require("speakeasy");
const bcrypt = require('bcrypt');
const validate = require('../../util/validator');
const { literal, Op, fn, col } = require('sequelize');
const path = require("path");
const fs = require('fs').promises;
const { Users, Posts, Comments, Like, Follow, Session } = require('../../model/index.js');
const sequelize = require('../../database/database.js');
const { v4: uuidv4 } = require('uuid');

// login
exports.logIn = async (req, res) => {
    const { email, password, ipAddress = "not provided" } = req.body;
    const rules = {
        email: "required|email|exist:users,email",
        password: "required|min:3"
    };
    const { status, message } = await validate({ email, password }, rules);
    if (!status) return response.failed(res, "Invalid information.", message)

    const user = await Users.findOne({ where: { email: email, status: "active" } });

    if (user?.role != "admin") return response.failed(res, "Unauthorized : Not an admin", "You are not an admin")

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ message: "Invalid username or password" });

    if (user.two_factor_enabled) return res.json({ message: 'Verify TOTP', two_factor_enabled: true });

    user.login_count += 1;
    await user.save();

    const session_id = uuidv4();
    await Session.create({
        session_id,
        user_id: user.user_id,
        userAgent: req.headers['user-agent'],
        ip: ipAddress,
    });

    const { user_id, name, username, role } = user;
    const token = jwt.sign({ user_id, name, email: user.email, username, role, session_id }, secret, { expiresIn: "1d" });
    return res.json({ message: 'Login successful', token, two_factor_enabled: false });

};

// 2fa login
exports.verifyLogin = async (req, res) => {
    const { email, password, TOTP, ipAddress = "not provided" } = req.body;

    let { status, message } = await validate(
        { email, password, TOTP },
        { email: "required|email|exist:users,email", password: "required", TOTP: "required|numeric" }
    );

    if (!status) return response.failed(res, message);

    const user = await Users.findOne({ where: { email: email, status: "active", role: "admin" } });

    if (!user || !user.two_factor_secret) {
        return response.failed(res, "2FA setup not initiated.");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) return response.failed(res, "Invalid Email or Password", "Invalid Email or Password")

    const isVerified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: TOTP,
        window: 1,
    });

    if (!isVerified) return response.failed(res, "Invalid TOTP", "Invalid TOTP");

    user.login_count += 1;
    await user.save();

    const session_id = uuidv4();
    await Session.create({
        session_id,
        user_id: user.user_id,
        userAgent: req.headers['user-agent'],
        ip: ipAddress,
    });

    const { user_id, name, username, role } = user;
    const token = jwt.sign({ user_id, name, email: user.email, username, role, session_id }, secret, { expiresIn: "1d" });
    return res.json({ message: 'Login successful', token });

}


// get all users list
exports.getAllUsers = async (req, res) => {
    const { limit = 10, page = 1, sortColumn = 'user_id', sortDirection = 'asc', search = "" } = req.query;

    const rules = { limit: "numeric", page: "numeric" };
    let { status, message } = await validate({ limit, page }, rules);
    if (!status) return response.failed(res, message);

    if (!['asc', 'desc'].includes(sortDirection.toLowerCase())) {
        return response.failed(res, `Invalid sort direction. Use "asc" or "desc"`);
    }

    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (search) {
        whereCondition = {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { user_id: { [Op.like]: `%${search}%` } },
                { username: { [Op.like]: `%${search}%` } }
            ]
        };
    }

    try {
        const { count, rows } = await Users.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortColumn, sortDirection.toLowerCase()]],
            attributes: {
                exclude: ['password'],
                include: [
                    [literal('(SELECT COUNT(*) FROM Posts WHERE Posts.user_id = users.user_id)'), 'Posts']
                ]
            },

        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            users: rows,
            count,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.log("\n\nError : " + error)
        return response.serverError(res);
    }


};


exports.getDashboardAnalytics = async (req, res) => {

    try {
        const totalUsers = await Users.count();
        const totalPosts = await Posts.count();
        const activeUsers = await Users.count({
            where: { status: 'active' }
        });

        const twoFactorEnabledUsers = await Users.count({
            where: { two_factor_enabled: true }
        });

        //  user role distribution
        const roleDistribution = await Users.findAll({
            attributes: [
                'role',
                [fn('COUNT', col('user_id')), 'count']
            ],
            group: ['role']
        });

        //  public vs private profile count
        const profilePrivacyDistribution = await Users.findAll({
            attributes: [
                'public',
                [fn('COUNT', col('user_id')), 'count']
            ],
            group: ['public']
        });

        //  user status distribution
        const statusDistribution = await Users.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('user_id')), 'count']
            ],
            group: ['status']
        });

        const userRegistrationTimeline = await Users.findAll({
            attributes: [
                [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
                [fn('COUNT', col('user_id')), 'count']
            ],
            group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m')],
            order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'ASC']]
        });

        // login activity distribution
        // const loginActivityDistribution = await Users.findAll({
        //     attributes: [
        //         'login_count', 'name', 'user_id'
        //     ],
        //     group: ['login_count'],
        //     order: [['login_count', 'DESC']],
        //     limit: 10
        // });


        // login activity distribution
        const loginActivityDistribution = await Users.findAll({
            attributes: [
                'login_count',
                [fn('MAX', col('name')), 'name'],
                [fn('MAX', col('user_id')), 'user_id']
            ],
            group: ['login_count'],
            order: [['login_count', 'DESC']],
            limit: 10
        });

        //  posts distribution//  10 users by post count
        const postsDistribution = await Users.findAll({
            attributes: [
                'user_id',
                'username',
                [literal('(SELECT COUNT(*) FROM Posts WHERE Posts.user_id = users.user_id)'), 'post_count']
            ],
            order: [[literal('post_count'), 'DESC']],
            limit: 5
        });

        // followers  // top most followed user
        const followDistribution = await Users.findAll({
            attributes: [
                'user_id', 'username',
                [literal(`(SELECT COUNT(*) FROM follow WHERE follow.followerId = users.user_id)`), "followers_count"]
            ],
            order: [[literal('followers_count'), 'DESC']],
            limit: 5
        })

        return response.success(res, "Success", {
            overview: {
                totalUsers,
                activeUsers,
                twoFactorEnabledUsers,
                totalPosts
            },
            distributions: {
                roles: roleDistribution,
                profilePrivacy: profilePrivacyDistribution,
                status: statusDistribution,
            },
            timeline: {
                userRegistration: userRegistrationTimeline
            },
            topUsers: {
                byPosts: postsDistribution,
                byfollowers: followDistribution,
                byLoginActivity: loginActivityDistribution,
            }
        });

    } catch (error) {
        console.error("Dashboard Analytics Error:", error);
        return response.serverError(res, error, "Error fetching dashboard analytics!");
    }
};


// get a particular user by user_id
exports.getUserDetails = async (req, res) => {
    let { user_id } = req.params;
    const rules = { user_id: "required|exist:users,user_id" };
    let { status, message } = await validate({ user_id }, rules);
    if (!status) return response.failed(res, message);

    const user = await Users.findOne({
        where: { user_id },
        attributes: {
            exclude: ['password', 'otp'],
            include: [
                [literal(`(SELECT COUNT(*) FROM Posts WHERE Posts.user_id = users.user_id)`), 'posts'],
                [literal('(SELECT COUNT(*) FROM follow WHERE follow.followingId = users.user_id AND follow.status = "accepted")'), 'followers'],
                [literal('(SELECT COUNT(*) FROM follow WHERE follow.followerId = users.user_id AND follow.status = "accepted")'), 'following'],
            ]
        },
    });

    return response.success(res, "User found", user);


}


// edit users profile
exports.editProfile = async (req, res) => {
    const { user_id } = req.params;
    const { name, username, email, bio, role, status, public } = req.body;

    const rules = { user_id: "required|exist:users,user_id", name: "required", username: "required", public: "required" };
    let { status: validation_status, message } = await validate({ user_id, name, username, bio, public }, rules);
    if (!validation_status) return response.failed(res, message);


    if (req.fileValidationError) {
        console.log(req.fileValidationError);
        return response.failed(res, "Invalid image!", req.fileValidationError);
    }

    const user = await Users.findOne({ where: { user_id }, attributes: ['profile_img'] });
    if (!user) return response.failed(res, "User not found!");

    const updatedData = { name, bio, username, public, email, role, status };
    if (req.file) updatedData.profile_img = req.file.path; // new image path

    const updatedUser = await Users.update(updatedData, { where: { user_id } });
    if (updatedUser[0] === 0) {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting new image after failed update:", err);
            });
        }
        return response.failed(res, "No changes made.");
    }

    if (req.file && user.profile_img && user.profile_img != 'uploads/profile.jpeg') {
        const oldImagePath = path.join(__dirname, '../../', user.profile_img);
        fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
            else console.log("Old image deleted successfully");
        });
    }
    return response.success(res, "Successfully updateed", updatedUser)

};



// delete / block / unblock
exports.changeStatus = async (req, res) => {
    const { user_id } = req.params;
    const { status } = req.body;

    const rules = { user_id: "required|numeric", status: "required|in:active,blocked,deleted" };
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


// login as user
exports.getUserToken = async (req, res) => {
    const { user_id } = req.params;
    const {
        ipAddress = "not provided"
    } = req.body;

    const { status, message } = await validate({ user_id }, { user_id: "required|numeric|exist:users,user_id" });
    if (!status) return response.failed(res, "Invalid information.", message);
    const user = await Users.findByPk(user_id);
    if (!user) return response.failed(res, "Invalid information!", "User not found!");

    //generate session using uuid

    const session_id = uuidv4();
    // save session
    await Session.create({
        session_id,
        user_id: user.user_id,
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: ipAddress
    });

    const { user_id: id, name, username, role } = user;
    const token = jwt.sign(
        { user_id: id, name, email: user.email, username, role, session_id },
        secret,
        { expiresIn: "1d" }
    );
    return response.success(res, `Token generation Success.`, token);
}


// get all sessions
exports.getSessions = async (req, res) => {
    const { user_id } = req.params;

    const rules = {
        user_id: "required",
    };
    let { status, message } = await validate({ user_id }, rules);
    if (!status) return response.failed(res, message);

    let sessions = await Session.findAll({
        where: { user_id },
        order: [["createdAt", "DESC"]],
    });

    return response.success(res, "Sessions found", sessions);
};


// delete all sessions axcept current session
exports.deleteAllSessions = async (req, res) => {
    const { user_id } = req?.params;
    const rules = { user_id: "required|exist:users,user_id" };
    const { status, message } = await validate({ user_id }, rules);
    if (!status) return response.failed(res, message);

    const deletedCount = await Session.destroy({
        where: {
            user_id,
        }
    });
    return response.success(res, `Successfully deleted ${deletedCount} session(s)`);
};



// delete a particular session
exports.deleteSession = async (req, res) => {
    const { session_id } = req?.params;

    const rules = {
        session_id: "required",
    };
    const { status, message } = await validate({ session_id }, rules);
    if (!status) return response.failed(res, message);

    const deletedCount = await Session.destroy({ where: { session_id } });
    if (deletedCount === 0) {
        console.log("No session found with that ID.");
        return response.failed(res, "No session found with id");
    }
    return response.success(res, "Session Deleted");

};