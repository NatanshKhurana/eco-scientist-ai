import { createContext, useContext, useEffect, useState } from "react";

import useChatStream from "../hooks/useChatStream";
import useConversation from "../hooks/useConversation";

import { getSessionId, clearConversationId } from "../utils/storage";

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

  const [activeConversationId, setActiveConversationId] = useState(null);

  // ============================
  // Initial Restore
  // ============================

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

  // ============================
  // New Conversation Created
  // ============================

  useEffect(() => {
    const handleConversationCreated = async (event) => {
      const conversationId = event.detail?.conversationId;

      if (!conversationId) {
        return;
      }

      setActiveConversationId(conversationId);

      const conversation = await openConversation(conversationId);

      if (conversation) {
        setMessages(conversation.messages || []);
      }

      await loadConversations();
    };

    window.addEventListener("conversationCreated", handleConversationCreated);

    return () => {
      window.removeEventListener(
        "conversationCreated",
        handleConversationCreated,
      );
    };
  }, []);

  // ============================
  // Select Conversation
  // ============================

  const selectConversation = async (id) => {
    if (isStreaming) {
      return;
    }

    const conversation = await openConversation(id);

    if (!conversation) {
      return;
    }

    setActiveConversationId(conversation._id);

    setMessages(conversation.messages || []);
  };

  // ============================
  // New Chat
  // ============================

  const startNewChat = () => {
    if (isStreaming) {
      stopStreaming();
    }

    clearConversationId();

    createNewChat();

    setActiveConversationId(null);

    setMessages([]);
  };

  // ============================
  // Rename
  // ============================

  const renameChat = async (id, title) => {
    const result = await renameConversation(id, title);

    return result;
  };

  // ============================
  // Delete
  // ============================

  const deleteChat = async (id) => {
    const deletingActive = activeConversationId === id;

    const success = await deleteConversation(id);

    if (!success) {
      return false;
    }

    if (deletingActive) {
      clearConversationId();

      setActiveConversationId(null);

      setMessages([]);

      // reload latest list

      const updated = await loadConversations();

      // open next available chat

      if (updated.length > 0) {
        const nextChat = updated[0];

        const conversation = await openConversation(nextChat._id);

        if (conversation) {
          setActiveConversationId(conversation._id);

          setMessages(conversation.messages || []);
        }
      }
    }

    return true;
  };

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;
};
