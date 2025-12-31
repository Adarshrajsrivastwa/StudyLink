const Chat = require("../models/message.model");
const ChatConversation = require("../models/conversation.model");
const User = require("../models/auth.model");
const Purchase = require("../models/purchase.model");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Get Socket.IO instance
const { getIO } = require("../socket");
let io;
try {
  io = getIO();
} catch (err) {
  console.warn("Socket.IO not available:", err.message);
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const FREE_MESSAGES_LIMIT = 10;

// Get or create conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const user = req.user;
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID is required",
      });
    }

    // Find or create conversation
    let conversation = await ChatConversation.findOne({
      student: user._id,
      mentor: mentorId,
    }).populate("mentor", "name email photoFileName role");

    if (!conversation) {
      // Verify mentor exists
      const mentor = await User.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: "Mentor not found",
        });
      }

      // Create new conversation
      conversation = new ChatConversation({
        student: user._id,
        mentor: mentorId,
        freeMessagesUsed: 0,
        totalMessages: 0,
      });

      await conversation.save();
      await conversation.populate("mentor", "name email photoFileName role");
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    console.error("Get conversation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all conversations for user
exports.getConversations = async (req, res) => {
  try {
    const user = req.user;

    const conversations = await ChatConversation.find({
      $or: [{ student: user._id }, { mentor: user._id }],
      isActive: true,
    })
      .populate("student", "name email photoFileName")
      .populate("mentor", "name email photoFileName")
      .sort({ lastMessageAt: -1 })
      .lean();

    // Get last message for each conversation
    for (const conv of conversations) {
      const lastChat = await Chat.findOne({
        conversation: conv._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      conv.lastMessage = lastChat;
    }

    return res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (err) {
    console.error("Get conversations error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (
      conversation.student.toString() !== user._id.toString() &&
      conversation.mentor.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const chats = await Chat.find({ conversation: conversationId })
      .populate("sender", "name email photoFileName")
      .populate("receiver", "name email photoFileName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    return res.status(200).json({
      success: true,
      data: chats.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Chat.countDocuments({ conversation: conversationId }),
      },
    });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId, content } = req.body;

    if (!conversationId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and chat content are required",
      });
    }

    // Get conversation
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Verify user is part of conversation
    const isStudent = conversation.student.toString() === user._id.toString();
    const isMentor = conversation.mentor.toString() === user._id.toString();

    if (!isStudent && !isMentor) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const receiverId = isStudent
      ? conversation.mentor
      : conversation.student;

    // Check if chat requires payment (only for students, after free messages)
    let requiresPayment = false;
    let chatPrice = 0;
    let paymentOrderId = null;

    if (isStudent && conversation.freeMessagesUsed >= FREE_MESSAGES_LIMIT) {
      // Get mentor's message rate
      const mentor = await User.findById(conversation.mentor);
      chatPrice = mentor.messageRate || 10; // Default 10 INR per chat
      requiresPayment = true;
    }

    if (requiresPayment) {
      // Create payment order
      const options = {
        amount: chatPrice * 100, // Convert to paise
        currency: "INR",
        receipt: `chat_${Date.now()}_${user._id}`,
        notes: {
          userId: user._id.toString(),
          conversationId: conversationId.toString(),
          type: "chat",
        },
      };

      const order = await razorpay.orders.create(options);
      paymentOrderId = order.id;

      return res.status(200).json({
        success: false,
        requiresPayment: true,
        message: `You have used all ${FREE_MESSAGES_LIMIT} free chats. Please pay to continue.`,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          chatPrice: chatPrice,
          conversationId: conversationId,
          content: content,
        },
      });
    }

    // Create chat (free chat)
    const chat = new Chat({
      conversation: conversationId,
      sender: user._id,
      receiver: receiverId,
      content: content.trim(),
      isPaid: false,
    });

    await chat.save();

    // Update conversation
    if (isStudent) {
      conversation.freeMessagesUsed += 1;
    }
    conversation.totalMessages += 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await chat.populate("sender", "name email photoFileName");
    await chat.populate("receiver", "name email photoFileName");

    // Emit Socket.IO event for real-time updates
    if (io) {
      io.to(`conversation-${conversationId}`).emit('new-message', {
        message: chat.toObject(),
        conversationId: conversationId.toString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Chat sent successfully",
      data: chat,
      remainingFreeMessages:
        FREE_MESSAGES_LIMIT - conversation.freeMessagesUsed,
    });
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Verify message payment and send message
exports.verifyMessagePayment = async (req, res) => {
  try {
    const user = req.user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      conversationId,
      content,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !conversationId ||
      !content
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details and chat content are required",
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Get conversation
    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Verify user is the student
    if (conversation.student.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get order details to get amount
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const chatPrice = order.amount / 100; // Convert from paise

    // Create purchase record
    const purchase = new Purchase({
      user: user._id,
      resource: conversationId, // Using resource field for conversation ID
      amount: chatPrice,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "completed",
      paymentDate: new Date(),
    });

    await purchase.save();

    // Create chat
    const chat = new Chat({
      conversation: conversationId,
      sender: user._id,
      receiver: conversation.mentor,
      content: content.trim(),
      isPaid: true,
      paymentAmount: chatPrice,
      paymentId: purchase._id,
    });

    await chat.save();

    // Update conversation
    conversation.totalMessages += 1;
    conversation.totalPaid += chatPrice;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await chat.populate("sender", "name email photoFileName");
    await chat.populate("receiver", "name email photoFileName");

    // Emit Socket.IO event for real-time updates
    if (io) {
      io.to(`conversation-${conversationId}`).emit('new-message', {
        message: chat.toObject(),
        conversationId: conversationId.toString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Chat sent successfully",
      data: chat,
    });
  } catch (err) {
    console.error("Verify message payment error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const user = req.user;
    const { messageId } = req.params;

    const chat = await Chat.findById(messageId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Only receiver can mark as read
    if (chat.receiver.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!chat.readAt) {
      chat.readAt = new Date();
      await chat.save();
    }

    return res.status(200).json({
      success: true,
      message: "Chat marked as read",
      data: chat,
    });
  } catch (err) {
    console.error("Mark as read error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
