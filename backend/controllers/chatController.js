const mongoose = require("mongoose");
const axios = require("axios");

const Conversation = require("../models/Conversation");

// ==================================================
// Helpers
// ==================================================

const createConversationTitle = (message) => {
  if (!message || !message.trim()) {
    return "New Conversation";
  }

  const cleaned = message
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[#*_`]/g, "")
    .replace(/[.!?]+$/g, "");

  const words = cleaned.split(" ");

  const MAX_WORDS = 7;

  let title = words.slice(0, MAX_WORDS).join(" ");

  if (words.length > MAX_WORDS) {
    title += "...";
  }

  return title || "New Conversation";
};

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

const getOwnerFilter = ({ userId, sessionId }) => {
  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error("Invalid userId");
    }

    return {
      userId,
    };
  }

  if (sessionId && sessionId.trim()) {
    return {
      sessionId: sessionId.trim(),
    };
  }

  throw new Error("Either userId or sessionId is required");
};

const createNewConversation = async ({ userId, sessionId, message }) => {
  const owner = getOwnerFilter({
    userId,
    sessionId,
  });

  return Conversation.create({
    ...owner,

    title: createConversationTitle(message),

    messages: [],

    lastActivityAt: new Date(),
  });
};

const findOwnedConversation = async ({ conversationId, userId, sessionId }) => {
  if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
    return null;
  }

  const owner = getOwnerFilter({
    userId,
    sessionId,
  });

  return Conversation.findOne({
    _id: conversationId,
    ...owner,
  });
};

// ==================================================
// NORMAL CHAT API
// ==================================================

exports.sendMessage = async (req, res) => {
  const requestStartedAt = Date.now();

  try {
    const { userId, sessionId, conversationId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "message required",
      });
    }

    let conversation = null;

    if (conversationId) {
      conversation = await findOwnedConversation({
        conversationId,
        userId,
        sessionId,
      });
    }

    if (!conversation) {
      conversation = await createNewConversation({
        userId,
        sessionId,
        message,
      });
    }

    // Previous context only.
    // Current question is already separately sent
    // to the AI service.
    const memoryContext = buildMemoryContext(conversation);

    conversation.messages.push({
      role: "user",
      content: message.trim(),
    });

    await conversation.save();

    const aiStartedAt = Date.now();

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

    const aiTime = Date.now() - aiStartedAt;

    const reply = aiResponse.data.response;

    conversation.messages.push({
      role: "assistant",
      content: reply,
    });

    conversation.lastActivityAt = new Date();

    const databaseStartedAt = Date.now();

    await conversation.save();

    const databaseTime = Date.now() - databaseStartedAt;

    return res.status(200).json({
      success: true,

      conversationId: conversation._id,

      title: conversation.title,

      reply,

      messageCount: conversation.messages.length,

      performance: {
        total_time_ms: Date.now() - requestStartedAt,

        ai_time_ms: aiTime,

        database_time_ms: databaseTime,
      },
    });
  } catch (error) {
    console.error("Send Message Error:", error);

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
  try {
    const { userId, sessionId, conversationId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "message required",
      });
    }

    let conversation = null;

    // Existing chat -> continue.
    if (conversationId) {
      conversation = await findOwnedConversation({
        conversationId,
        userId,
        sessionId,
      });
    }

    // No active conversation ->
    // New Analysis creates a fresh document.
    if (!conversation) {
      conversation = await createNewConversation({
        userId,
        sessionId,
        message,
      });
    }

    // IMPORTANT:
    // Build context BEFORE pushing current user
    // message, avoiding prompt duplication.
    const memoryContext = buildMemoryContext(conversation);

    conversation.messages.push({
      role: "user",
      content: message.trim(),
    });

    conversation.lastActivityAt = new Date();

    await conversation.save();

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache, no-transform");

    res.setHeader("Connection", "keep-alive");

    res.setHeader("X-Accel-Buffering", "no");

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    let finalResponse = "";
    let upstreamBuffer = "";
    let streamFinished = false;

    const aiResponse = await axios({
      method: "POST",

      url: `${process.env.AI_SERVICE_URL}/api/chat/stream`,

      data: {
        message: message.trim(),

        conversation_context: JSON.stringify(memoryContext),
      },

      responseType: "stream",

      timeout: 60000,
    });

    const completeStream = async (upstreamCompleteData = {}) => {
      if (streamFinished) {
        return;
      }

      streamFinished = true;

      if (finalResponse.trim()) {
        conversation.messages.push({
          role: "assistant",
          content: finalResponse,
        });
      }

      conversation.lastActivityAt = new Date();

      await conversation.save();

      if (!res.writableEnded && !res.destroyed) {
        res.write(
          `data:${JSON.stringify({
            ...upstreamCompleteData,

            type: "complete",

            conversationId: conversation._id,

            title: conversation.title,
          })}\n\n`,
        );

        res.end();
      }
    };

    aiResponse.data.on("data", (chunk) => {
      upstreamBuffer += chunk.toString("utf8");

      const events = upstreamBuffer.split("\n\n");

      upstreamBuffer = events.pop() || "";

      for (const rawEvent of events) {
        if (!rawEvent.trim()) {
          continue;
        }

        const dataLines = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"));

        if (dataLines.length === 0) {
          continue;
        }

        const payload = dataLines.map((line) => line.slice(5).trim()).join("");

        if (!payload) {
          continue;
        }

        try {
          const data = JSON.parse(payload);

          if (data.type === "content") {
            finalResponse += data.text || "";

            if (!res.writableEnded && !res.destroyed) {
              res.write(`data:${JSON.stringify(data)}\n\n`);
            }
          }

          if (data.type === "complete") {
            completeStream(data).catch((error) => {
              console.error("Stream completion error:", error);

              if (!res.writableEnded) {
                res.write(
                  `data:${JSON.stringify({
                    type: "error",

                    message: "Failed to save conversation",
                  })}\n\n`,
                );

                res.end();
              }
            });
          }

          if (data.type === "error") {
            if (!res.writableEnded && !res.destroyed) {
              res.write(`data:${JSON.stringify(data)}\n\n`);

              res.end();
            }
          }
        } catch (error) {
          console.error("SSE Parse Error:", error.message);
        }
      }
    });

    aiResponse.data.on("end", () => {
      if (!streamFinished && finalResponse.trim()) {
        completeStream().catch((error) => {
          console.error("Stream end save error:", error);
        });
      }
    });

    aiResponse.data.on("error", (error) => {
      console.error("AI Stream Error:", error.message);

      if (!res.writableEnded) {
        res.write(
          `data:${JSON.stringify({
            type: "error",

            message: error.message,
          })}\n\n`,
        );

        res.end();
      }
    });

    res.on("close", () => {
      if (!res.writableEnded && aiResponse.data) {
        aiResponse.data.destroy();
      }
    });
  } catch (error) {
    console.error("Stream Message Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }

    if (!res.writableEnded) {
      res.write(
        `data:${JSON.stringify({
          type: "error",
          message: error.message,
        })}\n\n`,
      );

      res.end();
    }
  }
};

// ==================================================
// GET GUEST SESSION CONVERSATIONS
// ==================================================

exports.getGuestConversations = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        error: "sessionId required",
      });
    }

    // Sidebar does not need complete
    // message bodies.
    const conversations = await Conversation.find({
      sessionId: sessionId.trim(),
    })
      .sort({
        lastActivityAt: -1,
      })
      .select("_id title lastActivityAt createdAt updatedAt")
      .lean();

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Guest Conversations Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==================================================
// GET SINGLE CONVERSATION
// ==================================================

exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { userId, sessionId } = req.query;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversationId",
      });
    }

    const owner = getOwnerFilter({
      userId,
      sessionId,
    });

    const conversation = await Conversation.findOne({
      _id: conversationId,

      ...owner,
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
    console.error("Get Conversation Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==================================================
// RENAME CONVERSATION
// ==================================================

exports.renameConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { title, userId, sessionId } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,

        error: "Invalid conversationId",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,

        error: "title required",
      });
    }

    const cleanTitle = title.trim().replace(/\s+/g, " ").slice(0, 80);

    const owner = getOwnerFilter({
      userId,
      sessionId,
    });

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,

        ...owner,
      },
      {
        $set: {
          title: cleanTitle,

          lastActivityAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,

        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,

      conversation: {
        _id: conversation._id,

        title: conversation.title,

        updatedAt: conversation.updatedAt,

        lastActivityAt: conversation.lastActivityAt,
      },
    });
  } catch (error) {
    console.error("Rename Conversation Error:", error);

    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

// ==================================================
// DELETE CONVERSATION
// ==================================================

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { userId, sessionId } = req.body || {};

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,

        error: "Invalid conversationId",
      });
    }

    const owner = getOwnerFilter({
      userId,
      sessionId,
    });

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,

      ...owner,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,

        error: "Conversation not found",
      });
    }

    return res.json({
      success: true,

      deletedConversationId: conversation._id,
    });
  } catch (error) {
    console.error("Delete Conversation Error:", error);

    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

// ==================================================
// HISTORY
// ==================================================

exports.getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { userId, sessionId } = req.query;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,

        error: "Invalid conversationId",
      });
    }

    const owner = getOwnerFilter({
      userId,
      sessionId,
    });

    const conversation = await Conversation.findOne({
      _id: conversationId,

      ...owner,
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
// AUTHENTICATED USER CONVERSATIONS
// ==================================================

exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,

        error: "Invalid userId",
      });
    }

    const conversations = await Conversation.find({
      userId,
    })
      .sort({
        lastActivityAt: -1,
      })
      .select("_id title lastActivityAt createdAt updatedAt")
      .lean();

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
