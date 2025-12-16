const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mentor is required"],
    },
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    duration: {
      type: Number, // Duration in minutes
      required: [true, "Duration is required"],
      min: [15, "Duration must be at least 15 minutes"],
      default: 60,
    },
    meetingLink: {
      type: String,
      required: [true, "Meeting link is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    enrolledStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    maxStudents: {
      type: Number,
      default: 50,
      min: [1, "Max students must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SessionSchema.index({ course: 1, scheduledDate: 1 });
SessionSchema.index({ mentor: 1, scheduledDate: 1 });
SessionSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model("Session", SessionSchema);


const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mentor is required"],
    },
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    duration: {
      type: Number, // Duration in minutes
      required: [true, "Duration is required"],
      min: [15, "Duration must be at least 15 minutes"],
      default: 60,
    },
    meetingLink: {
      type: String,
      required: [true, "Meeting link is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    enrolledStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    maxStudents: {
      type: Number,
      default: 50,
      min: [1, "Max students must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SessionSchema.index({ course: 1, scheduledDate: 1 });
SessionSchema.index({ mentor: 1, scheduledDate: 1 });
SessionSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model("Session", SessionSchema);


