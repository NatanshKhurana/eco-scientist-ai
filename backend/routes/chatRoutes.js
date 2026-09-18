const express = require("express");

const router = express.Router();

const {
  sendMessage,

  streamMessage,

  getConversationHistory,

  getUserConversations,
} = require("../controllers/chatController");

// Normal Chat

router.post("/send", sendMessage);

// Streaming Chat

router.post("/stream", streamMessage);

// Conversation History

router.get("/history/:conversationId", getConversationHistory);

// User Conversations

router.get("/user/:userId", getUserConversations);

module.exports = router;
