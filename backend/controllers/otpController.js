const User = require('../models/auth.model')
const {
  generateOtp,
  sendOtpEmail,
  saveOtpToUser,
} = require("../services/otpService");

// ===============================
// SEND OTP (EMAIL ONLY)
// ===============================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const otp = generateOtp();
    await saveOtpToUser(normalizedEmail, otp);
    await sendOtpEmail(normalizedEmail, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully to your email!",
    });
  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error sending OTP", 
      error: err.message 
    });
  }
};

// ===============================
// VERIFY OTP (EMAIL)
// ===============================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ 
        success: false,
        message: "OTP is required" 
      });
    }

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    // Find user by email and explicitly select OTP fields
    const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ 
        success: false,
        message: "No OTP found. Please request a new OTP." 
      });
    }

    // Validate OTP using model method
    if (!user.isOtpValid(otp)) {
      // Check specific reason for failure
      if (user.otp !== otp) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid OTP" 
        });
      }
      
      // OTP matches but expired
      return res.status(400).json({ 
        success: false,
        message: "OTP Expired. Please request a new one." 
      });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully!",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error verifying OTP", 
      error: err.message 
    });
  }
};

