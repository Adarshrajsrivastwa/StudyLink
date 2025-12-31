const User = require("../Models/auth.model");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const { generateOtp, sendOtpEmail, saveOtpToUser } = require("../services/otpService");

// Get Socket.IO instance
const { getIO } = require("../socket");
let io;
try {
  io = getIO();
} catch (err) {
  console.warn("Socket.IO not available:", err.message);
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: "Password is required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Create new user - password will be hashed automatically by the model's pre-save hook
    const user = new User({
      name: name ? name.trim() : null,
      email: normalizedEmail,
      password: password, // Will be hashed by pre-save hook
      role: role || "student",
      isEmailVerified: false,
    });

    await user.save();

    const otp = generateOtp();
    await saveOtpToUser(user.email, otp);
    await sendOtpEmail(user.email, otp);

    return res.status(201).json({
      success: true,
      message: "Registration successful! Please verify your email.",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (err) {
    console.error("Register error:", err);
    
    // Handle duplicate email error (MongoDB unique constraint)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: "Password is required" 
      });
    }

    // Find user by email and explicitly select password field (since it has select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Compare passwords using the model method
    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Resend OTP
      const otp = generateOtp();
      await saveOtpToUser(user.email, otp);
      await sendOtpEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        message: "Please verify your email first. A new OTP has been sent to your email.",
        requiresVerification: true,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // User is attached to req by auth middleware
    const user = req.user;

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        role: user.role,
        photoFileName: user.photoFileName,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update user profile (email cannot be changed)
exports.updateProfile = async (req, res) => {
  try {
    const { name, mobile, address, role } = req.body;
    const user = req.user;

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture from Cloudinary if exists
      if (user.photoFileName) {
        try {
          const cloudinary = require("../config/cloudinary");
          // Try to extract public_id from the stored URL
          // multer-storage-cloudinary stores full URL in req.file.path
          // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
          const urlParts = user.photoFileName.split('/');
          const uploadIndex = urlParts.findIndex(part => part === 'upload');
          if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
            // Get everything after 'upload'
            const pathAfterUpload = urlParts.slice(uploadIndex + 1);
            // Filter out version number (starts with 'v' followed by digits)
            const pathWithoutVersion = pathAfterUpload.filter(part => {
              if (part.startsWith('v') && part.length > 1) {
                const versionNum = part.substring(1);
                if (!isNaN(versionNum)) {
                  return false; // Skip version number
                }
              }
              return true;
            });
            // Join and remove file extension to get public_id
            const publicId = pathWithoutVersion.join('/').replace(/\.[^/.]+$/, '');
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          }
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
          // Continue even if deletion fails
        }
      }
      // Save new profile picture URL
      user.photoFileName = req.file.path;
    }

    // Update only allowed fields (email is not allowed to be changed)
    if (name !== undefined) {
      user.name = name.trim() || null;
    }
    if (mobile !== undefined) {
      user.mobile = mobile ? mobile.trim() : null;
    }
    if (address !== undefined) {
      user.address = address ? address.trim() : null;
    }
    if (role !== undefined) {
      // Validate role
      const validRoles = ["student", "teacher", "admin", "superadmin"];
      if (validRoles.includes(role)) {
        user.role = role;
      }
    }

    await user.save();

    // Emit Socket.IO event for real-time profile updates (if user is a mentor)
    if (io && (user.role === "teacher" || user.role === "admin" || user.role === "superadmin")) {
      // Emit to all clients so they can update the mentor list
      io.emit('mentor-profile-updated', {
        mentorId: user._id.toString(),
        mentor: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          photoFileName: user.photoFileName,
          role: user.role,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        role: user.role,
        photoFileName: user.photoFileName,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = req.user;

    if (!user.photoFileName) {
      return res.status(400).json({
        success: false,
        message: "No profile picture to delete",
      });
    }

    // Delete from Cloudinary
    try {
      const cloudinary = require("../config/cloudinary");
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
      const urlParts = user.photoFileName.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Get everything after 'upload'
        const pathAfterUpload = urlParts.slice(uploadIndex + 1);
        // Filter out version number (starts with 'v' followed by digits)
        const pathWithoutVersion = pathAfterUpload.filter(part => {
          if (part.startsWith('v') && part.length > 1) {
            const versionNum = part.substring(1);
            if (!isNaN(versionNum)) {
              return false; // Skip version number
            }
          }
          return true;
        });
        // Join and remove file extension to get public_id
        const publicId = pathWithoutVersion.join('/').replace(/\.[^/.]+$/, '');
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (deleteError) {
      console.error("Error deleting profile picture from Cloudinary:", deleteError);
      // Continue even if Cloudinary deletion fails
    }

    // Remove from user record
    user.photoFileName = null;
    await user.save();

    // Emit Socket.IO event for real-time profile updates (if user is a mentor)
    if (io && (user.role === "teacher" || user.role === "admin" || user.role === "superadmin")) {
      // Emit to all clients so they can update the mentor list
      io.emit('mentor-profile-updated', {
        mentorId: user._id.toString(),
        mentor: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          photoFileName: user.photoFileName,
          role: user.role,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        role: user.role,
        photoFileName: user.photoFileName,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Delete profile picture error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
