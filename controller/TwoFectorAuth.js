const validate = require("../util/validator");
const response = require("../util/response");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const secret = process.env.SECRET_KEY;
const bcrypt = require("bcrypt");
const { Users, Session } = require("../model");
const { v4: uuidv4 } = require("uuid");

exports.enable2Fa = async (req, res) => {
  const { user_id } = req.body;

  let { status, message } = await validate(
    { user_id },
    { user_id: "required|exist:users,user_id" }
  );
  if (!status) return response.failed(res, message);
  if (user_id != req.user.user_id) return response.failed(res, "Unauthorized!");

  const secret = speakeasy.generateSecret({ name: "instabook" });
  await Users.update(
    { two_factor_secret: secret.base32 },
    { where: { user_id } }
  );
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  response.success(res, "2FA setup initiated.", {
    qrCode,
    secret: secret.base32,
  });
};

exports.verify2Fa = async (req, res) => {
  const { user_id, TOTP } = req.body;

  let { status, message } = await validate(
    { user_id, TOTP },
    { user_id: "required|exist:users,user_id", TOTP: "required" }
  );
  if (!status) return response.failed(res, message);
  if (user_id != req.user.user_id) return response.failed(res, "Unauthorized!");

  const user = await Users.findOne({ where: { user_id } });

  if (!user || !user.two_factor_secret) {
    return response.failed(res, "2FA setup not initiated.");
  }

  const isVerified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: "base32",
    token: TOTP,
    window: 1,
  });

  if (!isVerified) {
    return response.failed(res, "Invalid TOTP");
  }

  await Users.update(
    {
      two_factor_secret: user.two_factor_secret,
      two_factor_enabled: true,
    },
    { where: { user_id } }
  );

  response.success(res, "2FA enabled successfully.");
};

exports.verifyLogin = async (req, res) => {
  const { email, password, TOTP, ipAddress = "not provided" } = req.body;

  let { status, message } = await validate(
    { email, password, TOTP },
    {
      email: "required|email|exist:users,email",
      password: "required",
      TOTP: "required|numeric",
    }
  );

  if (!status) return response.failed(res, message);

  const user = await Users.findOne({
    where: { email: email, status: "active" },
  });

  if (!user || !user.two_factor_secret) {
    return response.failed(res, "2FA setup not initiated.");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch)
    return response.failed(
      res,
      "Invalid Email or Password",
      "Invalid Email or Password"
    );

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
    userAgent: req.headers["user-agent"],
    ip: ipAddress,
  });

  const { user_id, name, username } = user;
  const token = jwt.sign(
    { user_id, name, email: user.email, username, session_id },
    secret,
    { expiresIn: "1d" }
  );

  return res.json({ message: "Login successful", token });
};

exports.disable2Fa = async (req, res) => {
  const { user_id, TOTP } = req.body;

  let { status, message } = await validate(
    { user_id, TOTP },
    { user_id: "required|exist:users,user_id", TOTP: "required|numeric" }
  );
  if (!status) return response.failed(res, message);

  if (user_id != req.user.user_id) {
    return response.failed(res, "Unauthorized!");
  }

  const user = await Users.findOne({ where: { user_id } });

  if (!user || !user.two_factor_enabled) {
    return response.failed(res, "2FA is not enabled for this user.");
  }

  const isVerified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: "base32",
    token: TOTP,
    window: 1,
  });

  if (!isVerified) {
    return response.failed(res, "Invalid TOTP.");
  }

  await Users.update(
    {
      two_factor_enabled: false,
      two_factor_secret: null,
    },
    { where: { user_id } }
  );

  response.success(res, "2FA has been successfully disabled.");
};
