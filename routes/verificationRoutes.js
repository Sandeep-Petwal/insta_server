const express = require("express");
const verificationRoutes = express.Router();
const { enable2Fa, disable2Fa, verify2Fa, verifyLogin } = require("../controller/TwoFectorAuth.js");
const { createTempUser, verifyUserRegistration, sendForgetPassMail, verifyForgetPassword, changePassword } = require("../controller/emailController.js")
const { authentication } = require('../middleware/authentication.js');
const asyncHandler = require("../middleware/asyncHandler.js");

verificationRoutes.post("/enable-2fa", authentication, asyncHandler(enable2Fa));
verificationRoutes.post("/verify-2fa", authentication, asyncHandler(verify2Fa));
verificationRoutes.post("/disable2Fa", authentication, asyncHandler(disable2Fa));
verificationRoutes.post("/login", asyncHandler(verifyLogin));

verificationRoutes.post("/createtempuser", asyncHandler(createTempUser));
verificationRoutes.post("/userregistration", asyncHandler(verifyUserRegistration));
verificationRoutes.post("/forgotpassword", asyncHandler(sendForgetPassMail));
verificationRoutes.post("/verifyforgotpass", asyncHandler(verifyForgetPassword));
verificationRoutes.post("/changepassword/:user_id", authentication, asyncHandler(changePassword));

module.exports = verificationRoutes;