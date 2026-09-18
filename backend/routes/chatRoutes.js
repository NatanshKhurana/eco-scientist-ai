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

  mergeGuestConversations,
} = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");

const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

// Chat

router.post("/send", optionalAuthMiddleware, sendMessage);

router.post("/stream", optionalAuthMiddleware, streamMessage);

// Guest List

router.get(
  "/session/:sessionId",

  getGuestConversations,
);

// Single Conversation

router.get(
  "/conversation/:conversationId",

  optionalAuthMiddleware,

  getConversationById,
);

// History

router.get(
  "/history/:conversationId",

  optionalAuthMiddleware,

  getConversationHistory,
);

// User Conversations

router.get(
  "/user",

  authMiddleware,

  getUserConversations,
);

// Merge Guest

router.post(
  "/merge",

  authMiddleware,

  mergeGuestConversations,
);

// Rename

router.patch(
  "/conversation/:conversationId/title",

  optionalAuthMiddleware,

  renameConversation,
);

// Delete

router.delete(
  "/conversation/:conversationId",

  optionalAuthMiddleware,

  deleteConversation,
);

module.exports = router;
