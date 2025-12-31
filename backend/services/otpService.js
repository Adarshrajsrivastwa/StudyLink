const User = require("../models/auth.model");
const transporter = require("../config/mailer");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const getOtpExpiry = () => Date.now() + 10 * 60 * 1000; // 10 minutes

// -------------------------
// Send OTP via EMAIL
// -------------------------
const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification OTP - Study Link",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

const saveOtpToUser = async (email, otp) => {
  const expiry = getOtpExpiry();

  return await User.findOneAndUpdate(
    { email },
    { otp, otpExpiry: expiry },
    { new: true, upsert: true }
  );
};

// -------------------------
// Export all functions
// -------------------------
module.exports = {
  generateOtp,
  getOtpExpiry,
  sendOtpEmail,
  saveOtpToUser,
};
