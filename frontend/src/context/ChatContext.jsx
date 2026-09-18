import { createContext, useContext, useEffect, useState } from "react";

import useChatStream from "../hooks/useChatStream";

import useConversation from "../hooks/useConversation";

import {
  getSessionId,
  getConversationId,
  clearConversationId,
} from "../utils/storage";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const {
    messages,
    setMessages,

    sendMessage,

    stopStreaming,

    isStreaming,

    error,
  } = useChatStream();

  const {
    conversations,

    currentConversation,

    loadConversations,

    openConversation,

    restoreConversation,

    createNewChat,

    renameConversation,

    deleteConversation,
  } = useConversation();

  const [sessionId, setSessionId] = useState(null);

  const [activeConversationId, setActiveConversationId] = useState(() =>
    getConversationId(),
  );

  // =====================================
  // Initial Restore
  // =====================================

  useEffect(() => {
    const session = getSessionId();

    setSessionId(session);

    const initialize = async () => {
      await loadConversations();

      const conversation = await restoreConversation();

      if (conversation) {
        setActiveConversationId(conversation._id);

        setMessages(conversation.messages || []);
      }
    };

    initialize();
  }, []);

  // =====================================
  // Stream Completion
  // =====================================

  useEffect(() => {
    const handleConversationUpdated = async (event) => {
      const conversationId = event.detail?.conversationId;

      if (conversationId) {
        setActiveConversationId(conversationId);
      }

      await loadConversations();
    };

    window.addEventListener("conversationCreated", handleConversationUpdated);

    return () => {
      window.removeEventListener(
        "conversationCreated",
        handleConversationUpdated,
      );
    };
  }, []);

  // =====================================
  // Select Conversation
  // =====================================

  const selectConversation = async (conversationId) => {
    if (isStreaming) {
      return;
    }

    const conversation = await openConversation(conversationId);

    if (!conversation) {
      return;
    }

    setActiveConversationId(conversation._id);

    setMessages(conversation.messages || []);
  };

  // =====================================
  // New Analysis
  // =====================================

  const startNewChat = () => {
    if (isStreaming) {
      stopStreaming();
    }

    clearConversationId();

    createNewChat();

    setActiveConversationId(null);

    setMessages([]);
  };

  // =====================================
  // Rename
  // =====================================

  const renameChat = async (conversationId, title) => {
    return renameConversation(conversationId, title);
  };

  // =====================================
  // Delete
  // =====================================

  const deleteChat = async (conversationId) => {
    const wasActive = activeConversationId === conversationId;

    const success = await deleteConversation(conversationId);

    if (success && wasActive) {
      clearConversationId();

      setActiveConversationId(null);

      setMessages([]);
    }

    return success;
  };

  const value = {
    sessionId,

    messages,
    setMessages,

    sendMessage,
    stopStreaming,
    isStreaming,
    error,

    conversations,
    currentConversation,

    activeConversationId,

    selectConversation,

    startNewChat,

    renameChat,

    deleteChat,

    loadConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;
};
