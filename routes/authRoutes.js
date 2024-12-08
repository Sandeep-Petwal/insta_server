const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authRoutes = express.Router();
const { verify } = require('../middleware/authentication');
const {
    logIn,
} = require("../controller/userController");


authRoutes.post("/login", asyncHandler(logIn));
authRoutes.post("/verify", verify);


module.exports = authRoutes;