const mongoose = require("mongoose");
const axios = require("axios");

const Conversation = require("../models/Conversation");
const User = require("../models/User");

// ===============================
// Create Conversation Title
// ===============================

const createConversationTitle = (message) => {
  if (!message) {
    return "New Conversation";
  }

  const cleanedMessage = message.trim();

  if (cleanedMessage.length <= 50) {
    return cleanedMessage;
  }

  return `${cleanedMessage.substring(0, 50)}...`;
};

// ===============================
// Build Memory Context
// ===============================

const buildMemoryContext = (conversation) => {
  const recentMessages = conversation.messages.slice(-10);

  return {
    summary: conversation.summary || "",

    recentMessages: recentMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };
};

// ==================================================
// NORMAL CHAT API
// ==================================================

exports.sendMessage = async (req, res) => {
  const requestStartTime = Date.now();

  try {
    const { userId, conversationId, message } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "message is required",
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid userId",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId,

        title: createConversationTitle(message),

        messages: [],
      });
    }

    conversation.messages.push({
      role: "user",

      content: message.trim(),
    });

    const memoryContext = buildMemoryContext(conversation);

    const aiStart = Date.now();

    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/chat`,

      {
        message: message.trim(),

        conversation_context: JSON.stringify(memoryContext),
      },

      {
        timeout: 60000,
      },
    );

    const aiTime = Date.now() - aiStart;

    const reply = aiResponse.data.response;

    conversation.messages.push({
      role: "assistant",

      content: reply,
    });

    conversation.lastActivityAt = new Date();

    const dbStart = Date.now();

    await conversation.save();

    const databaseTime = Date.now() - dbStart;

    return res.json({
      success: true,

      conversationId: conversation._id,

      title: conversation.title,

      reply,

      messageCount: conversation.messages.length,

      performance: {
        total_time_ms: Date.now() - requestStartTime,

        ai_time_ms: aiTime,

        database_time_ms: databaseTime,
      },
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);

    return res.status(500).json({
      success: false,

      error: "Internal server error",

      details: error.message,
    });
  }
};

// ==================================================
// STREAM CHAT API
// ==================================================

exports.streamMessage = async (req, res) => {
  const streamStart = Date.now();

  try {
    const {
      userId,

      conversationId,

      message,
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,

        error: "message required",
      });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,

        userId,
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId,

        title: createConversationTitle(message),

        messages: [],
      });
    }

    conversation.messages.push({
      role: "user",

      content: message.trim(),
    });

    await conversation.save();

    const memoryContext = buildMemoryContext(conversation);

    // SSE headers

    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache");

    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    let finalResponse = "";

    let buffer = "";

    let firstTokenTime = null;

    const aiRequestStart = Date.now();

    const aiResponse = await axios({
      method: "POST",

      url: `${process.env.AI_SERVICE_URL}/api/chat/stream`,

      data: {
        message: message.trim(),

        conversation_context: JSON.stringify(memoryContext),
      },

      responseType: "stream",

      timeout: 120000,

      headers: {
        Accept: "text/event-stream",
      },
    });

    aiResponse.data.on("data", (chunk) => {
      if (!firstTokenTime) {
        firstTokenTime = Date.now() - aiRequestStart;
      }

      buffer += chunk.toString();

      const events = buffer.split("\n\n");

      buffer = events.pop();

      events.forEach((event) => {
        if (!event.startsWith("data:")) {
          return;
        }

        const jsonText = event.replace("data:", "").trim();

        if (!jsonText) {
          return;
        }

        try {
          const data = JSON.parse(jsonText);

          if (data.type === "content") {
            finalResponse += data.text;

            res.write(`data: ${JSON.stringify(data)}\n\n`);
          }

          if (data.type === "complete") {
            conversation.messages.push({
              role: "assistant",

              content: finalResponse,
            });

            conversation.lastActivityAt = new Date();

            conversation.save();

            const total = Date.now() - streamStart;

            console.log(`

========== NODE STREAM TIMING ==========

First Token : ${firstTokenTime} ms

Total Time  : ${total} ms

=======================================

`);

            res.write(
              `data: ${JSON.stringify({
                type: "complete",

                message: "Stream completed",

                node_time_ms: total,

                first_token_ms: firstTokenTime,
              })}\n\n`,
            );

            res.end();
          }
        } catch (error) {
          console.log("SSE JSON Parse Error:", error.message);
        }
      });
    });

    aiResponse.data.on("error", (error) => {
      console.log("AI Stream Error:", error.message);

      res.write(
        `data:${JSON.stringify({
          type: "error",

          message: error.message,
        })}\n\n`,
      );

      res.end();
    });

    req.on("close", () => {
      console.log("Client disconnected");

      aiResponse.data.destroy();
    });
  } catch (error) {
    console.error("Stream Message Error:", error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,

        error: error.message,
      });
    }

    res.write(
      `data:${JSON.stringify({
        type: "error",

        message: error.message,
      })}\n\n`,
    );

    res.end();
  }
};

// ==================================================
// GET HISTORY
// ==================================================

exports.getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { userId } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,

      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,

        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,

      conversation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

// ==================================================
// USER CONVERSATIONS
// ==================================================

exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      userId,
    }).sort({
      lastActivityAt: -1,
    });

    return res.json({
      success: true,

      conversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};
