const express = require("express");
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  verifyMessagePayment,
  markAsRead,
} = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth");

// Protected routes
router.get("/conversations", authenticate, getConversations);
router.get("/conversation/:mentorId", authenticate, getOrCreateConversation);
router.get("/conversation/:conversationId/chats", authenticate, getMessages);
router.post("/send", authenticate, sendMessage);
router.post("/verify-payment", authenticate, verifyMessagePayment);
router.put("/:chatId/read", authenticate, markAsRead);

module.exports = router;


