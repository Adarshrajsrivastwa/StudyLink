const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: { 
      type: String, 
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      index: true, // Index for faster queries
    },

    mobile: { 
      type: String, 
      unique: true, 
      sparse: true, 
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Please provide a valid mobile number"],
    },

    address: { 
      type: String, 
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },

    role: {
      type: String,
      enum: {
        values: ["student", "teacher", "admin", "superadmin"],
        message: "Role must be one of: student, teacher, admin, superadmin",
      },
      default: "student",
    },

    photoFileName: { 
      type: String, 
      default: null,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password in queries by default
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true, // Index for faster queries on verification status
    },

    otp: {
      type: String,
      default: null,
      select: false, // Don't return OTP in queries by default
    },

    otpExpiry: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
    messageRate: {
      type: Number,
      default: 10, // Default 10 INR per message
      min: [0, "Message rate cannot be negative"],
    },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiry;
        return ret;
      },
    },
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password") || !this.password) {
    return;
  }

  // Skip if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (/^\$2[ayb]\$.{56}$/.test(this.password)) {
    return;
  }

  // Hash password with cost of 10
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to check if OTP is valid
UserSchema.methods.isOtpValid = function (otp) {
  if (!this.otp || !this.otpExpiry) {
    return false;
  }
  
  if (this.otp !== otp) {
    return false;
  }
  
  if (Date.now() > this.otpExpiry) {
    return false;
  }
  
  return true;
};

module.exports = mongoose.model("User", UserSchema);
