const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  // Default to 7 days if JWT_EXPIRES_IN is not set
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      mobile: user.mobile,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};
