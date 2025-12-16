const express = require("express");
const router = express.Router();

const { sendOtp, verifyOtp} = require("../controllers/otpController");

// Send OTP (email or mobile)
router.post("/send-otp", sendOtp);

// Verify OTP
router.post("/verify-otp", verifyOtp);

module.exports = router;
