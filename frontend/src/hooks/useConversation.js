import { useState } from "react";
import axios from "axios";

import {
  getSessionId,
  getConversationId,
  setConversationId,
  clearConversation,
  getUserId,
} from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function useConversation() {
  const [conversations, setConversations] = useState([]);

  const [currentConversation, setCurrentConversation] = useState(null);

  const [loading, setLoading] = useState(false);

  // =====================================
  // Owner
  // =====================================

  const getOwner = () => {
    const userId = getUserId();

    if (userId) {
      return {
        userId,
      };
    }

    return {
      sessionId: getSessionId(),
    };
  };

  // =====================================
  // Load Conversations
  // =====================================

  const loadConversations = async () => {
    try {
      setLoading(true);

      const owner = getOwner();

      let response;

      if (owner.userId) {
        response = await axios.get(`${API_URL}/api/chat/user/${owner.userId}`);
      } else {
        response = await axios.get(
          `${API_URL}/api/chat/session/${owner.sessionId}`,
        );
      }

      const list = response.data.conversations || [];

      setConversations(list);

      return list;
    } catch (error) {
      console.error("Load conversations error:", error);

      return [];
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Open Conversation
  // =====================================

  const openConversation = async (conversationId) => {
    try {
      setLoading(true);

      const owner = getOwner();

      const response = await axios.get(
        `${API_URL}/api/chat/conversation/${conversationId}`,

        {
          params: owner,
        },
      );

      const conversation = response.data.conversation;

      if (!conversation) {
        return null;
      }

      setCurrentConversation(conversation);

      setConversationId(conversation._id);

      return conversation;
    } catch (error) {
      console.error("Open conversation error:", error);

      return null;
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // Restore Current Conversation
  // =====================================

  const restoreConversation = async () => {
    const conversationId = getConversationId();

    if (!conversationId) {
      return null;
    }

    const conversation = await openConversation(conversationId);

    if (!conversation) {
      clearConversation();
    }

    return conversation;
  };

  // =====================================
  // Create New Chat
  // =====================================

  const createNewChat = () => {
    clearConversation();

    setCurrentConversation(null);
  };

  // =====================================
  // Rename Conversation
  // =====================================

  const renameConversation = async (conversationId, title) => {
    const cleanTitle = title?.trim();

    if (!cleanTitle) {
      return false;
    }

    try {
      const owner = getOwner();

      const response = await axios.patch(
        `${API_URL}/api/chat/conversation/${conversationId}/title`,

        {
          ...owner,

          title: cleanTitle,
        },
      );

      const updated = response.data.conversation;

      setConversations((previous) =>
        previous.map((item) =>
          item._id === conversationId
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );

      setCurrentConversation((previous) => {
        if (!previous || previous._id !== conversationId) {
          return previous;
        }

        return {
          ...previous,

          ...updated,
        };
      });

      return true;
    } catch (error) {
      console.error("Rename conversation error:", error);

      return false;
    }
  };

  // =====================================
  // Delete Conversation
  // =====================================

  const deleteConversation = async (conversationId) => {
    try {
      const owner = getOwner();

      await axios.delete(
        `${API_URL}/api/chat/conversation/${conversationId}`,

        {
          data: owner,
        },
      );

      setConversations((previous) =>
        previous.filter((item) => item._id !== conversationId),
      );

      if (currentConversation?._id === conversationId) {
        clearConversation();

        setCurrentConversation(null);
      }

      return true;
    } catch (error) {
      console.error("Delete conversation error:", error);

      return false;
    }
  };

  return {
    conversations,

    currentConversation,

    loading,

    loadConversations,

    openConversation,

    restoreConversation,

    createNewChat,

    renameConversation,

    deleteConversation,

    setConversations,
  };
}
