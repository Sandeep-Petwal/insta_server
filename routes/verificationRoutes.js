const express = require("express");
const emailController = require("../controller/emailController")
const TwoFectorAuth = require("../controller/TwoFectorAuth.js")
const verificationRoutes = express.Router();
const auth = require('../middleware/authentication.js');


// request to enable 2fa
verificationRoutes.post("/enable-2fa", auth.authentication, TwoFectorAuth.enable2Fa)
verificationRoutes.post("/verify-2fa", auth.authentication, TwoFectorAuth.verify2Fa)
verificationRoutes.post("/disable2Fa", auth.authentication, TwoFectorAuth.disable2Fa)

// verify 2fa login
verificationRoutes.post("/login", TwoFectorAuth.verifyLogin)








verificationRoutes.post("/createtempuser", emailController.createTempUser); // http://localhost:3005/api/verify/createtempuser
verificationRoutes.post("/userregistration", emailController.verifyUserRegistration); // http://localhost:3005/api/verify/userregistration

verificationRoutes.post("/forgotpassword", emailController.sendForgetPassMail);
verificationRoutes.post("/verifyforgotpass", emailController.verifyForgetPassword);  // http://localhost:3005/api/verify/verifyforgotpass/3

verificationRoutes.post("/changepassword/:user_id", auth.authentication, emailController.changePassword);  // http://localhost:3005/api/verify/changepassword/3
// verificationRoutes.post("/verifychangepassword",  emailController.verifyChangePassword)



module.exports = verificationRoutes