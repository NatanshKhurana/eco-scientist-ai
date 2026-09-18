const express = require("express");

const router = express.Router();

const {
  sendMessage,
  streamMessage,

  getGuestConversations,
  getConversationById,
  getConversationHistory,
  getUserConversations,

  renameConversation,
  deleteConversation,
} = require("../controllers/chatController");

// =======================================
// Chat
// =======================================

router.post("/send", sendMessage);

router.post("/stream", streamMessage);

// =======================================
// Guest Conversation List
// =======================================

router.get("/session/:sessionId", getGuestConversations);

// =======================================
// Single Conversation
// =======================================

router.get("/conversation/:conversationId", getConversationById);

// =======================================
// Rename Conversation
// =======================================

router.patch("/conversation/:conversationId/title", renameConversation);

// =======================================
// Delete Conversation
// =======================================

router.delete("/conversation/:conversationId", deleteConversation);

// =======================================
// Legacy / History
// =======================================

router.get("/history/:conversationId", getConversationHistory);

// =======================================
// Authenticated User Conversations
// =======================================

router.get("/user/:userId", getUserConversations);

module.exports = router;
