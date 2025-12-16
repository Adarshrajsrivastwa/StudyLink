const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["programming", "mathematics", "science", "language", "business", "design", "other"],
        message: "Invalid category",
      },
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // in hours
      default: 0,
    },
    lessons: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      videoUrl: String,
      duration: Number, // in minutes
      order: Number,
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
CourseSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Course", CourseSchema);


const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["programming", "mathematics", "science", "language", "business", "design", "other"],
        message: "Invalid category",
      },
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // in hours
      default: 0,
    },
    lessons: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      videoUrl: String,
      duration: Number, // in minutes
      order: Number,
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
CourseSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Course", CourseSchema);


