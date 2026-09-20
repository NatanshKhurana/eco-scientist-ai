const mongoose = require("mongoose");
const axios = require("axios");

const Conversation = require("../models/Conversation");

const { generateAITitle } = require("../services/titleService");

const {
  getOwnerFilter,
  getOwnerFilterFromRequest,
} = require("../utils/conversationOwnership");

// ==================================================
// Configuration
// ==================================================

const AI_REQUEST_TIMEOUT_MS = 60000;

const TITLE_WAIT_AFTER_RESPONSE_MS = 1500;

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

// ==================================================
// Build Conversation Memory
// ==================================================

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
// Validate Conversation ID
// ==================================================

const validateConversationId = (conversationId) => {
  if (!mongoose.isValidObjectId(conversationId)) {
    const error = new Error("Invalid conversationId");

    error.statusCode = 400;

    throw error;
  }
};

// ==================================================
// Create New Conversation
// ==================================================

const createNewConversation = async ({ userId, sessionId, message }) => {
  const owner = getOwnerFilter({
    userId,
    sessionId,
  });

  return Conversation.create({
    ...owner,

    title: createConversationTitle(message),

    titleGenerated: false,

    messages: [],

    lastActivityAt: new Date(),
  });
};

// ==================================================
// Find Owned Conversation
// ==================================================

const findOwnedConversation = async ({ conversationId, userId, sessionId }) => {
  validateConversationId(conversationId);

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
// Start AI Title Generation
// ==================================================

const startTitleGeneration = (message) => {
  return generateAITitle(message)
    .then((title) => {
      if (!title || !title.trim()) {
        return null;
      }

      return title.trim();
    })
    .catch((error) => {
      console.error("AI Title Generation Error:", error.message);

      return null;
    });
};

// ==================================================
// Wait For Title Without Blocking Too Long
// ==================================================

const resolveTitleWithTimeout = async (titlePromise) => {
  if (!titlePromise) {
    return {
      ready: false,
      title: null,
    };
  }

  return Promise.race([
    titlePromise.then((title) => ({
      ready: true,
      title,
    })),

    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ready: false,
          title: null,
        });
      }, TITLE_WAIT_AFTER_RESPONSE_MS);
    }),
  ]);
};

// ==================================================
// Update Title Later If AI Was Slow
// ==================================================

const updateTitleInBackground = (conversationId, titlePromise) => {
  if (!titlePromise) {
    return;
  }

  titlePromise
    .then(async (title) => {
      if (!title || !title.trim()) {
        return;
      }

      await Conversation.findOneAndUpdate(
        {
          _id: conversationId,

          titleGenerated: {
            $ne: true,
          },
        },

        {
          $set: {
            title: title.trim(),

            titleGenerated: true,
          },
        },
      );
    })
    .catch((error) => {
      console.error("Background Title Update Error:", error.message);
    });
};

// ==================================================
// Controller Error Response
// ==================================================

const sendControllerError = (
  res,
  error,
  fallbackMessage = "Internal server error",
) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,

    error: statusCode === 500 ? fallbackMessage : error.message,

    ...(statusCode === 500
      ? {
          details: error.message,
        }
      : {}),
  });
};

// ==================================================
// NORMAL CHAT API
// ==================================================

exports.sendMessage = async (req, res) => {
  const requestStartedAt = Date.now();

  try {
    const { conversationId, message } = req.body;

    const userId = req.user?._id || null;

    const sessionId = req.user ? null : req.body.sessionId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,

        error: "message required",
      });
    }

    let conversation = null;

    let isNewConversation = false;

    let titlePromise = null;

    // ----------------------------------
    // Existing Conversation
    // ----------------------------------

    if (conversationId) {
      conversation = await findOwnedConversation({
        conversationId,
        userId,
        sessionId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,

          error: "Conversation not found",
        });
      }
    }

    // ----------------------------------
    // New Analysis
    // ----------------------------------

    if (!conversation) {
      conversation = await createNewConversation({
        userId,
        sessionId,
        message,
      });

      isNewConversation = true;

      // Start title generation now.
      // Do NOT await here.
      titlePromise = startTitleGeneration(message);
    }

    // ----------------------------------
    // Previous memory only
    // ----------------------------------

    const memoryContext = buildMemoryContext(conversation);

    // ----------------------------------
    // Save user message
    // ----------------------------------

    conversation.messages.push({
      role: "user",

      content: message.trim(),
    });

    conversation.lastActivityAt = new Date();

    await conversation.save();

    // ----------------------------------
    // Main AI Response
    // ----------------------------------

    const aiStartedAt = Date.now();

    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/chat`,

      {
        message: message.trim(),

        conversation_context: JSON.stringify(memoryContext),
      },

      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );

    const aiTime = Date.now() - aiStartedAt;

    const reply = aiResponse.data.response;

    if (!reply || !String(reply).trim()) {
      throw new Error("AI service returned an empty response");
    }

    // ----------------------------------
    // Resolve AI title
    // ----------------------------------

    if (isNewConversation && titlePromise) {
      const titleResult = await resolveTitleWithTimeout(titlePromise);

      if (titleResult.ready && titleResult.title) {
        conversation.title = titleResult.title;

        conversation.titleGenerated = true;
      }
    }

    // ----------------------------------
    // Save assistant response
    // ----------------------------------

    conversation.messages.push({
      role: "assistant",

      content: reply,
    });

    conversation.lastActivityAt = new Date();

    const databaseStartedAt = Date.now();

    await conversation.save();

    const databaseTime = Date.now() - databaseStartedAt;

    // ----------------------------------
    // AI title was slower than response
    // ----------------------------------

    if (isNewConversation && titlePromise && !conversation.titleGenerated) {
      updateTitleInBackground(conversation._id, titlePromise);
    }

    return res.status(200).json({
      success: true,

      conversationId: conversation._id,

      title: conversation.title,

      titleGenerated: conversation.titleGenerated,

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

    return sendControllerError(res, error);
  }
};

// ==================================================
// STREAM CHAT API
// ==================================================

exports.streamMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    const userId = req.user?._id || null;

    const sessionId = req.user ? null : req.body.sessionId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,

        error: "message required",
      });
    }

    let conversation = null;

    let isNewConversation = false;

    let titlePromise = null;

    // ----------------------------------
    // Existing conversation
    // ----------------------------------

    if (conversationId) {
      conversation = await findOwnedConversation({
        conversationId,
        userId,
        sessionId,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,

          error: "Conversation not found",
        });
      }
    }

    // ----------------------------------
    // New Analysis
    // ----------------------------------

    if (!conversation) {
      conversation = await createNewConversation({
        userId,
        sessionId,
        message,
      });

      isNewConversation = true;

      // Start in parallel with main AI.
      titlePromise = startTitleGeneration(message);
    }

    // ----------------------------------
    // Previous conversation context
    // ----------------------------------

    const memoryContext = buildMemoryContext(conversation);

    // ----------------------------------
    // Save current user message
    // ----------------------------------

    conversation.messages.push({
      role: "user",

      content: message.trim(),
    });

    conversation.lastActivityAt = new Date();

    await conversation.save();

    // ----------------------------------
    // SSE Headers
    // ----------------------------------

    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache, no-transform");

    res.setHeader("Connection", "keep-alive");

    res.setHeader("X-Accel-Buffering", "no");

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    // Send metadata immediately.
    // Older frontend safely ignores this.
    res.write(
      `data:${JSON.stringify({
        type: "meta",

        conversationId: conversation._id,

        title: conversation.title,

        isNewConversation,
      })}\n\n`,
    );

    let finalResponse = "";

    let upstreamBuffer = "";

    let streamFinished = false;

    // ----------------------------------
    // Call AI Service
    // ----------------------------------

    const aiResponse = await axios({
      method: "POST",

      url: `${process.env.AI_SERVICE_URL}/api/chat/stream`,

      data: {
        message: message.trim(),

        conversation_context: JSON.stringify(memoryContext),
      },

      responseType: "stream",

      timeout: AI_REQUEST_TIMEOUT_MS,
    });

    // ----------------------------------
    // Complete Stream
    // ----------------------------------

    const completeStream = async (upstreamCompleteData = {}) => {
      if (streamFinished) {
        return;
      }

      streamFinished = true;

      // ------------------------------
      // Resolve title
      // ------------------------------

      if (isNewConversation && titlePromise) {
        const titleResult = await resolveTitleWithTimeout(titlePromise);

        if (titleResult.ready && titleResult.title) {
          conversation.title = titleResult.title;

          conversation.titleGenerated = true;
        }
      }

      // ------------------------------
      // Save assistant message
      // ------------------------------

      if (finalResponse.trim()) {
        conversation.messages.push({
          role: "assistant",

          content: finalResponse,
        });
      }

      conversation.lastActivityAt = new Date();

      await conversation.save();

      // ------------------------------
      // Slow title continues later
      // ------------------------------

      if (isNewConversation && titlePromise && !conversation.titleGenerated) {
        updateTitleInBackground(conversation._id, titlePromise);
      }

      // ------------------------------
      // Complete SSE event
      // ------------------------------

      if (!res.writableEnded && !res.destroyed) {
        res.write(
          `data:${JSON.stringify({
            ...upstreamCompleteData,

            type: "complete",

            conversationId: conversation._id,

            title: conversation.title,

            titleGenerated: conversation.titleGenerated,
          })}\n\n`,
        );

        res.end();
      }
    };

    // ----------------------------------
    // Receive AI Stream
    // ----------------------------------

    aiResponse.data.on("data", (chunk) => {
      upstreamBuffer += chunk.toString("utf8");

      const events = upstreamBuffer.split(/\r?\n\r?\n/);

      upstreamBuffer = events.pop() || "";

      for (const rawEvent of events) {
        if (!rawEvent.trim()) {
          continue;
        }

        const dataLines = rawEvent
          .split(/\r?\n/)
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

          // --------------------------
          // Content
          // --------------------------

          if (data.type === "content") {
            finalResponse += data.text || "";

            if (!res.writableEnded && !res.destroyed) {
              res.write(`data:${JSON.stringify(data)}\n\n`);
            }
          }

          // --------------------------
          // Complete
          // --------------------------

          if (data.type === "complete") {
            completeStream(data).catch((error) => {
              console.error("Stream Completion Error:", error);

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

          // --------------------------
          // Upstream Error
          // --------------------------

          if (data.type === "error") {
            console.error("AI Service Stream Error:", data.message);

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

    // ----------------------------------
    // AI stream ended without complete
    // ----------------------------------

    aiResponse.data.on("end", () => {
      if (streamFinished) {
        return;
      }

      if (finalResponse.trim()) {
        completeStream().catch((error) => {
          console.error("Stream End Save Error:", error);
        });

        return;
      }

      if (!res.writableEnded) {
        res.write(
          `data:${JSON.stringify({
            type: "error",

            message: "AI stream ended without a response",
          })}\n\n`,
        );

        res.end();
      }
    });

    // ----------------------------------
    // AI Stream Error
    // ----------------------------------

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

    // ----------------------------------
    // Client Disconnect
    // ----------------------------------

    res.on("close", () => {
      if (!res.writableEnded && aiResponse.data) {
        aiResponse.data.destroy();
      }
    });
  } catch (error) {
    console.error("Stream Message Error:", error);

    if (!res.headersSent) {
      return sendControllerError(res, error);
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

    const conversations = await Conversation.find({
      sessionId: sessionId.trim(),

      // only guest conversations
      // after login these will move to userId
      userId: null,
    })
      .sort({
        lastActivityAt: -1,
      })
      .select("_id title titleGenerated lastActivityAt createdAt updatedAt")
      .lean();

    return res.json({
      success: true,

      conversations,
    });
  } catch (error) {
    console.error("Get Guest Conversations Error:", error);

    return sendControllerError(res, error);
  }
};

// ==================================================
// GET SINGLE CONVERSATION
// ==================================================

exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    validateConversationId(conversationId);

    const owner = getOwnerFilterFromRequest(req);

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

    return sendControllerError(res, error);
  }
};

// ==================================================
// RENAME CONVERSATION
// ==================================================

exports.renameConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { title } = req.body;

    validateConversationId(conversationId);

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,

        error: "title required",
      });
    }

    const cleanTitle = title.trim().replace(/\s+/g, " ").slice(0, 80);

    const owner = getOwnerFilterFromRequest(req);

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,

        ...owner,
      },

      {
        $set: {
          title: cleanTitle,

          // Manual rename should never
          // be overwritten by AI title.
          titleGenerated: true,
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

        titleGenerated: conversation.titleGenerated,

        updatedAt: conversation.updatedAt,

        lastActivityAt: conversation.lastActivityAt,
      },
    });
  } catch (error) {
    console.error("Rename Conversation Error:", error);

    return sendControllerError(res, error);
  }
};

// ==================================================
// DELETE CONVERSATION
// ==================================================

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    validateConversationId(conversationId);

    const owner = getOwnerFilterFromRequest(req);

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

    return sendControllerError(res, error);
  }
};

// ==================================================
// HISTORY
// ==================================================

exports.getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    validateConversationId(conversationId);

    const owner = getOwnerFilterFromRequest(req);

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
    console.error("Get Conversation History Error:", error);

    return sendControllerError(res, error);
  }
};

// ==================================================
// AUTHENTICATED USER CONVERSATIONS
// ==================================================

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

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
      .select("_id title titleGenerated lastActivityAt createdAt updatedAt")
      .lean();

    return res.json({
      success: true,

      conversations,
    });
  } catch (error) {
    console.error("Get User Conversations Error:", error);

    return sendControllerError(res, error);
  }
};

// ==================================================
// MERGE GUEST CONVERSATIONS
// ==================================================

exports.mergeGuestConversations = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        success: false,

        error: "sessionId required",
      });
    }

    const result = await Conversation.updateMany(
      {
        sessionId: sessionId.trim(),

        $or: [
          {
            userId: null,
          },

          {
            userId: {
              $exists: false,
            },
          },
        ],
      },

      {
        $set: {
          userId: req.user._id,
        },

        $unset: {
          sessionId: "",
        },
      },
    );

    return res.json({
      success: true,

      mergedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Merge Guest Conversation Error:", error);

    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};
