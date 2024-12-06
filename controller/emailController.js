const { Users, Templates, Tempusers } = require("../model")
const bcrypt = require('bcryptjs');
const handlebars = require('handlebars');
const nodeMailer = require('../util/nodeMailer');
const validate = require('../util/validator');
const response = require("../util/response")

// create a temp user , send otp to provided email and store otp to tempuser model
exports.createTempUser = async (req, res) => {
    console.log("\ninside :: createTempUser\n");

    const { email, password, name, username } = req.body;
    const rules = {
        name: "required|string",
        username: "required|string|unique:users,username",
        email: "required|string|email|unique:users,email",
        password: "required|string|min:3"
    }
    let { status, message } = await validate({ email, password, name, username }, rules);
    if (!status) return response.failed(res, "Invalid information.", message)

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("\n user not exists, now sending OTP email:\n");

    // get the html, text, subject from db
    const verification_otp = Math.floor(1000 + Math.random() * 9000);
    const template = await Templates.findOne({ where: { template_id: 1 } })
    // Potential issue: template might not exist
    if (!template) {
        return response.failed(res, "Email template not found");
    }

    const compiledHtmlTemplate = handlebars.compile(template.html);
    const html = compiledHtmlTemplate({ otp: verification_otp });

    const compiledTextTemplate = handlebars.compile(template.text);
    const text = compiledTextTemplate({ otp: verification_otp });

    // Send the email
    await nodeMailer.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: template.subject,
        text,
        html
    });

    console.log("\nEmail sent now creating or updating tempuser:\n");

    let user = await Tempusers.findOne({ where: { email } });
    if (user) {
        user = await Tempusers.update({ name, email, username, password: hashedPassword, verification_otp }, { where: { email } })
    } else {
        user = await Tempusers.create({ name, email, username, password: hashedPassword, verification_otp });
    }

    res.json({ message: 'OTP sent!', user: { name: user.name, email: user.email } });
};

// verify user registration with stored and provided otp
exports.verifyUserRegistration = async (req, res) => {
    console.log("\ninside :: verifyUserRegistration\n");
    let { otp, email } = req.body;
    otp = parseInt(otp);

    const rules = {
        otp: "required|numeric",
        email: "required|email"
    }

    let { status, message } = await validate({ otp, email }, rules);
    if (!status) {
        return response.failed(res, "Provide correct information !", message)
    }

    const tempUser = await Tempusers.findOne({ where: { email } });
    if (!tempUser) {
        return response.failed(res, "User does not exist !")
    }

    console.log("\n Matching the otp tempUser.verification_otp :" + tempUser.verification_otp + " otp : " + otp);
    if (tempUser.verification_otp !== otp) {
        return response.failed(res, "Provide correct information !", "OTP does not match")
    }

    console.log("\nOtp matches now creating user in user table and deleting the tempuser\n");
    console.log(tempUser);
    const { name, username, password } = tempUser;
    let user_email = tempUser.email;

    const user = await Users.create({ name, email: user_email, username, password });
    if (!user) {
        return response.failed(res, "Provide correct information !", message)
    }

    // get the html, text, subject from db
    const template = await Templates.findOne({ where: { template_id: 2 } })
    if (!template) return response.failed(res, "Email template not found");


    const compiledHtmlTemplate = handlebars.compile(template.html);
    const html = compiledHtmlTemplate({ name });

    const compiledTextTemplate = handlebars.compile(template.text);
    const text = compiledTextTemplate({ name }); // Pass dynamic data

    // Send Welcome Email if everything is okay
    await nodeMailer.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: template.subject,
        text,
        html
    });

    // finally deleting user from tempuser
    await Tempusers.destroy({ where: { email } })

    res.json({ message: 'User created successfully', user });
}

exports.sendForgetPassMail = async (req, res) => {
    const { email } = req.body;
    const rules = {
        email: "email|required|string|exist:users,email"
    }

    let { status, message } = await validate({ email }, rules);
    if (!status) {
        return response.failed(res, "Provide correct information !", message)
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    const template = await Templates.findOne({ where: { template_id: 3 } })
    if (!template) return response.failed(res, "Email template not found");


    const compiledHtmlTemplate = handlebars.compile(template.html);
    const html = compiledHtmlTemplate({ otp });
    const compiledTextTemplate = handlebars.compile(template.text);
    const text = compiledTextTemplate({ otp });

    // Send the email
    await nodeMailer.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: template.subject,
        text,
        html
    });

    const updatedUser = await Users.update({ otp }, { where: { email } });
    if (updatedUser[0] === 0) {
        return response.failed(res, "Error Processing OTP", "Error Processing OTP")
    }
    return response.success(res, "OTP sent to your registered email")
}

exports.verifyForgetPassword = async (req, res) => {
    let { otp, email, password } = req.body;
    otp = parseInt(otp);

    const rules = {
        otp: "required|numeric",
        email: "required|email",
        password: "required|min:3"
    }

    let { status, message } = await validate({ otp, email, password }, rules);
    if (!status) {
        return response.failed(res, "Provide correct information !", message)
    }

    // if user exists
    const user = await Users.findOne({ where: { email } });
    if (!user) return response.notFound(res, "User not found")

    console.log("\n Matching the otp user.otp :" + user.otp + " otp : " + otp);
    if (user.otp !== otp) {
        return response.failed(res, "Otp does not match", "Otp does not match")
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatePassword = await Users.update({ password: hashedPassword, otp: 0 }, { where: { email } });

    if (updatePassword[0] === 0) {
        console.log("Error in updating the password !");
        return response.failed(res, "Error updating password", "Error updating password")
    }
    return response.success(res, "Successfully updated the password",)
};

// verify change password
exports.changePassword = async (req, res) => {
    const { user_id } = req.params;
    const { currentPass, newPass } = req.body;

    const rules = { currentPass: "required", newPass: "required", user_id: "required", }
    let { status, message } = await validate({ currentPass, newPass, user_id }, rules);
    if (!status) return response.failed(res, "Invalid details !", message)

    const user = await Users.findOne({ where: { user_id } });
    if (!user) return response.failed(res, "Provide correct information !", "User with this email not found!")

    const isPasswordMatch = await bcrypt.compare(currentPass, user.password);
    if (!isPasswordMatch) return response.failed(res, "Invalid password !", "Invalid email or password!")

    console.log("\nemail exists and password matches now updating the password\n");
    const hashedPassword = await bcrypt.hash(newPass, 10);

    const updatedUser = await Users.update({ password: hashedPassword }, { where: { user_id } });
    if (!updatedUser) {
        return response.failed(res, "Error while Changing password !", "Error while Changing password !")
    }
    return response.success(res, "Password changed successfully");
}