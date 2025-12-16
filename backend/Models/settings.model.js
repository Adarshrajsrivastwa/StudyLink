const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Settings key is required"],
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Settings value is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SettingsSchema.index({ key: 1 });

module.exports = mongoose.model("Settings", SettingsSchema);


