const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
  getOwnerFilterFromRequest,
} = require("../utils/conversationOwnership");
const Conversation = require("../models/Conversation");

test("uses the authenticated user as the conversation owner", () => {
  const userId = new mongoose.Types.ObjectId();
  const owner = getOwnerFilterFromRequest({
    user: {
      _id: userId,
    },
    body: {
      sessionId: "ignored-session",
    },
  });

  assert.deepEqual(owner, {
    userId,
  });
});

test("uses a trimmed guest session from the request body", () => {
  const owner = getOwnerFilterFromRequest({
    body: {
      sessionId: "  guest-123  ",
    },
  });

  assert.deepEqual(owner, {
    sessionId: "guest-123",
  });
});

test("accepts a guest session from query parameters", () => {
  const owner = getOwnerFilterFromRequest({
    query: {
      sessionId: "guest-query",
    },
  });

  assert.deepEqual(owner, {
    sessionId: "guest-query",
  });
});

test("does not trust a userId supplied by the client", () => {
  assert.throws(
    () =>
      getOwnerFilterFromRequest({
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
        },
      }),
    (error) =>
      error.statusCode === 401 &&
      error.message === "Authentication or sessionId required",
  );
});

test("persists the AI-title generation state in the conversation schema", () => {
  const titleGenerated = Conversation.schema.path("titleGenerated");

  assert.equal(titleGenerated.instance, "Boolean");
  assert.equal(titleGenerated.defaultValue, false);
});
