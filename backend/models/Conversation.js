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
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "New Conversation",
      trim: true,
    },

    /*
      Later hum old conversations ko summarize karke
      yahan store karenge.

      Example:
      "User has a wheat farm in Punjab with low soil carbon
      and is trying to improve biodiversity."
    */
    summary: {
      type: String,
      default: "",
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  userId: 1,
  lastActivityAt: -1,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);