const SESSION_KEY = "eco_session_id";

const CONVERSATION_KEY = "eco_conversation_id";

const USER_KEY = "eco_user";

export const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);

  if (!id) {
    id = crypto.randomUUID();

    localStorage.setItem(SESSION_KEY, id);
  }

  return id;
};

export const getConversationId = () => {
  return localStorage.getItem(CONVERSATION_KEY);
};

export const setConversationId = (id) => {
  if (id) {
    localStorage.setItem(CONVERSATION_KEY, id);
  }
};

export const clearConversationId = () => {
  localStorage.removeItem(CONVERSATION_KEY);
};

export const clearConversation = () => {
  clearConversationId();
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);

  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem(
    USER_KEY,

    JSON.stringify(user),
  );
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};
