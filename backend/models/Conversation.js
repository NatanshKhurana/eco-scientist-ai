const mongoose = require("mongoose");

// ======================================
// Message Schema
// ======================================

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,

      enum: ["user", "assistant"],

      required: true,
    },

    content: {
      type: String,

      required: true,
    },
  },

  {
    _id: false,

    timestamps: true,
  },
);

// ======================================
// Conversation Schema
// ======================================

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,

      index: true,
    },

    sessionId: {
      type: String,

      default: null,

      index: true,
    },

    title: {
      type: String,

      default: "New Conversation",
    },

    titleGenerated: {
      type: Boolean,

      default: false,
    },

    summary: {
      type: String,

      default: "",
    },

    messages: [messageSchema],

    lastActivityAt: {
      type: Date,

      default: Date.now,

      index: true,
    },
  },

  {
    timestamps: true,
  },
);

// ======================================
// Ownership Validation
// ======================================

conversationSchema.pre(
  "validate",

  function () {
    if (!this.userId && !this.sessionId) {
      throw new Error("Conversation requires owner");
    }
  },
);

// ======================================
// Indexes
// ======================================

conversationSchema.index({
  userId: 1,

  lastActivityAt: -1,
});

conversationSchema.index({
  sessionId: 1,

  lastActivityAt: -1,
});

module.exports = mongoose.model(
  "Conversation",

  conversationSchema,
);
