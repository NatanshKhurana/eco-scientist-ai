const SESSION_KEY = "eco_scientist_session_id";
const CONVERSATION_KEY = "eco_scientist_conversation_id";
const USER_KEY = "eco_scientist_user_id";

// =====================================
// Safe Storage Helpers
// =====================================

const safeGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Storage read error:", error);
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("Storage write error:", error);
  }
};

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Storage remove error:", error);
  }
};

// =====================================
// Session Management
// =====================================

const generateSessionId = () => {
  return (
    "eco_session_" +
    Date.now() +
    "_" +
    Math.random().toString(36).substring(2, 12)
  );
};

export const getSessionId = () => {
  let sessionId = safeGet(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();

    safeSet(SESSION_KEY, sessionId);
  }

  return sessionId;
};

export const setSessionId = (sessionId) => {
  if (!sessionId) return;

  safeSet(SESSION_KEY, sessionId);
};

// =====================================
// Conversation Management
// =====================================

export const getConversationId = () => {
  return safeGet(CONVERSATION_KEY);
};

export const setConversationId = (conversationId) => {
  if (!conversationId) return;

  safeSet(CONVERSATION_KEY, conversationId);
};

// Used by useConversation
export const saveConversationId = (conversationId) => {
  if (!conversationId) return;

  safeSet(CONVERSATION_KEY, conversationId);
};

// Clear current chat binding
export const clearConversationId = () => {
  safeRemove(CONVERSATION_KEY);
};

// Alias
export const clearConversation = () => {
  clearConversationId();
};

// New Analysis helper
export const startNewConversation = () => {
  clearConversationId();
};

// =====================================
// User Authentication Support
// =====================================

export const getUserId = () => {
  return safeGet(USER_KEY);
};

export const setUserId = (userId) => {
  if (!userId) return;

  safeSet(USER_KEY, userId);
};

export const clearUserId = () => {
  safeRemove(USER_KEY);
};

// =====================================
// Clear Everything
// =====================================

export const clearStorage = () => {
  safeRemove(SESSION_KEY);

  safeRemove(CONVERSATION_KEY);

  safeRemove(USER_KEY);
};
