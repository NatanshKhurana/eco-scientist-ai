import { useEffect, useRef, useState } from "react";

import useChatStream from "../hooks/useChatStream";
import useConversation from "../hooks/useConversation";
import { useAuthContext } from "../hooks/useAuthContext";
import { clearConversationId } from "../utils/storage";
import { ChatContext } from "./chatContextStore";

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
  const { user } = useAuthContext();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const firstUserEffect = useRef(true);

  useEffect(() => {
    const initialize = async () => {
      await loadConversations();
      const conversation = await restoreConversation();

      if (conversation) {
        setActiveConversationId(conversation._id);
        setMessages(conversation.messages || []);
      }
    };

    void initialize();
  }, [loadConversations, restoreConversation, setMessages]);

  useEffect(() => {
    if (firstUserEffect.current) {
      firstUserEffect.current = false;
      return;
    }

    const refreshForUser = async () => {
      await Promise.resolve();
      clearConversationId();
      setActiveConversationId(null);
      setMessages([]);
      await loadConversations();
    };

    void refreshForUser();
  }, [user, loadConversations, setMessages]);

  useEffect(() => {
    const refresh = async () => {
      clearConversationId();
      setActiveConversationId(null);
      setMessages([]);
      await loadConversations();
    };

    window.addEventListener("conversationRefresh", refresh);

    return () => window.removeEventListener("conversationRefresh", refresh);
  }, [loadConversations, setMessages]);

  useEffect(() => {
    const handleCreatedConversation = async (event) => {
      const id = event.detail?.conversationId;

      if (!id) {
        return;
      }

      setActiveConversationId(id);
      await loadConversations();
    };

    window.addEventListener("conversationCreated", handleCreatedConversation);

    return () =>
      window.removeEventListener(
        "conversationCreated",
        handleCreatedConversation,
      );
  }, [loadConversations]);

  const selectConversation = async (id) => {
    if (isStreaming) {
      return;
    }

    const conversation = await openConversation(id);

    if (conversation) {
      setActiveConversationId(conversation._id);
      setMessages(conversation.messages || []);
    }
  };

  const startNewChat = () => {
    if (isStreaming) {
      stopStreaming();
    }

    clearConversationId();
    createNewChat();
    setActiveConversationId(null);
    setMessages([]);
  };

  const renameChat = (id, title) => renameConversation(id, title);

  const deleteChat = async (id) => {
    const success = await deleteConversation(id);

    if (success && activeConversationId === id) {
      clearConversationId();
      setActiveConversationId(null);
      setMessages([]);
    }

    await loadConversations();

    return success;
  };

  return (
    <ChatContext.Provider
      value={{
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
