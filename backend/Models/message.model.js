const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Chat content is required"],
      trim: true,
      maxlength: [5000, "Chat cannot exceed 5000 characters"],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ChatSchema.index({ conversation: 1, createdAt: -1 });
ChatSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("Chat", ChatSchema);
