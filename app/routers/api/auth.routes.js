const express = require('express');
const authController = require('../../controllers/api/auth.controller');
const router = express.Router();


// for register new users
router.post('/register', authController.registerUser);

// for login users
router.post('/login', authController.loginUser);

// for forgot password email input
router.post("/forgot-password", authController.forgotPassword);


// for verifying otp
router.post("/verify-otp", authController.verifyOtp);

// for otp 
router.post("/reset-password", authController.resetPassword);


module.exports = router;