const secret = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
const validate = require("../../util/validator");
const response = require("../../util/response");
const { Users, Session } = require("../../model/");

exports.authentication = async (req, res, next) => {
  const token = req.headers["insta_admin"];
  if (!token) {
    console.log("No token provided!");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const user = jwt.verify(token, secret);
    if (user?.role !== "admin") {
      return response.unauthorized(res, "Not an admin");
    }

    // Check if session exists and is valid
    const session = await Session.findOne({
      where: { session_id: user.session_id },
    });

    if (!session)
      return response.unauthorized(res, "Session expired or invalid");

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    console.log("Token verification failed:", err);
    return response.unauthorized(res, "Unauthorized");
  }
};

// Verify admin token
exports.verify = async (req, res) => {
  const token = req.headers["insta_admin"];

  const rules = { token: "required|string" };

  let { status, message } = await validate({ token }, rules);
  if (!status)
    return response.failed(res, "Provide correct information.", message);

  try {
    const decodedUser = jwt.verify(token, secret);

    // Verify admin role
    if (decodedUser?.role !== "admin") {
      return response.unauthorized(res, "Not an admin");
    }

    // Check if session exists and is valid
    const session = await Session.findOne({
      where: {
        session_id: decodedUser.session_id,
      },
    });

    if (!session) {
      console.log("Session not found!");
      return response.unauthorized(res, "Session expired or invalid");
    }

    // Get updated user details
    const updated_user = await Users.findOne({
      where: { user_id: decodedUser.user_id },
      attributes: { exclude: ["password", "otp", "two_factor_secret"] },
    });

    if (updated_user.role !== "admin") {
      return response.unauthorized(res, "Not an admin");
    }

    if (updated_user.status !== "active") {
      return response.unauthorized(res, "Account is blocked");
    }

    return response.success(
      res,
      "Successfully verified the token",
      updated_user
    );
  } catch (error) {
    console.log("Error verifying admin:", error);
    return response.unauthorized(res, "Invalid or expired token");
  }
};
