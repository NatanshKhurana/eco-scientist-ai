const mongoose = require("mongoose");

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

const conversationSchema = new mongoose.Schema(
  {
    // Auth user

    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: false,

      index: true,
    },

    // Guest session

    sessionId: {
      type: String,

      required: false,

      index: true,
    },

    title: {
      type: String,

      default: "New Conversation",
    },

    summary: {
      type: String,

      default: "",
    },

    messages: {
      type: [messageSchema],

      default: [],
    },

    titleGenerated: {
      type: Boolean,

      default: false,
    },

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

// Prevent empty owner

conversationSchema.pre("validate", function () {
  if (!this.userId && !this.sessionId) {
    throw new Error("Conversation requires either userId or sessionId");
  }
});

conversationSchema.index({
  userId: 1,

  lastActivityAt: -1,
});

conversationSchema.index({
  sessionId: 1,

  lastActivityAt: -1,
});

module.exports = mongoose.model("Conversation", conversationSchema);
