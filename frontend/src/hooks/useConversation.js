import { useState } from "react";
import axios from "axios";

import {
  getSessionId,
  getConversationId,
  setConversationId,
  clearConversation,
  getUser,
} from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,

  withCredentials: true,
});

export default function useConversation() {
  const [conversations, setConversations] = useState([]);

  const [currentConversation, setCurrentConversation] = useState(null);

  const [loading, setLoading] = useState(false);

  const isLoggedIn = () => {
    return Boolean(getUser());
  };

  const loadConversations = async () => {
    try {
      setLoading(true);

      let response;

      if (isLoggedIn()) {
        response = await api.get("/api/chat/user");
      } else {
        const sessionId = getSessionId();

        response = await api.get(`/api/chat/session/${sessionId}`);
      }

      const list = response.data.conversations || [];

      setConversations(list);

      return list;
    } catch (error) {
      console.error(
        "Load conversations error:",
        error.response?.data || error.message,
      );

      setConversations([]);

      return [];
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (id) => {
    try {
      setLoading(true);

      const response = await api.get(`/api/chat/conversation/${id}`);

      const conversation = response.data.conversation;

      setCurrentConversation(conversation);

      setConversationId(conversation._id);

      return conversation;
    } catch (error) {
      console.error(
        "Open conversation error:",
        error.response?.data || error.message,
      );

      clearConversation();

      setCurrentConversation(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

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

  const createNewChat = () => {
    clearConversation();

    setCurrentConversation(null);
  };

  const renameConversation = async (id, title) => {
    try {
      const response = await api.patch(
        `/api/chat/conversation/${id}/title`,

        {
          title: title.trim(),
        },
      );

      const updated = response.data.conversation;

      setConversations((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );

      return true;
    } catch (error) {
      console.error("Rename error:", error.response?.data || error.message);

      return false;
    }
  };

  const deleteConversation = async (id) => {
    try {
      await api.delete(`/api/chat/conversation/${id}`);

      setConversations((prev) => prev.filter((item) => item._id !== id));

      if (currentConversation?._id === id) {
        clearConversation();

        setCurrentConversation(null);
      }

      return true;
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);

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
