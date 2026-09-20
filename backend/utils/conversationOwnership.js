const mongoose = require("mongoose");

const createRequestError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};

const getOwnerFilter = ({ userId, sessionId }) => {
  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw createRequestError("Invalid userId");
    }

    return {
      userId,
    };
  }

  if (typeof sessionId === "string" && sessionId.trim()) {
    return {
      sessionId: sessionId.trim(),
    };
  }

  throw createRequestError("Authentication or sessionId required", 401);
};

const getOwnerFilterFromRequest = (req) => {
  if (req.user?._id) {
    return getOwnerFilter({
      userId: req.user._id,
    });
  }

  const sessionId = req.body?.sessionId || req.query?.sessionId;

  return getOwnerFilter({
    sessionId,
  });
};

module.exports = {
  getOwnerFilter,
  getOwnerFilterFromRequest,
};
