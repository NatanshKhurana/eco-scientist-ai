import { useCallback, useState } from "react";
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

const isLoggedIn = () => Boolean(getUser());

export default function useConversation() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);

      const response = isLoggedIn()
        ? await api.get("/api/chat/user")
        : await api.get(`/api/chat/session/${getSessionId()}`);

      const list = response.data.conversations || [];
      setConversations(list);

      return list;
    } catch (requestError) {
      console.error(
        "Load conversations error:",
        requestError.response?.data || requestError.message,
      );
      setConversations([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const openConversation = useCallback(async (id) => {
    try {
      setLoading(true);

      const response = await api.get(`/api/chat/conversation/${id}`, {
        params: isLoggedIn()
          ? undefined
          : {
              sessionId: getSessionId(),
            },
      });
      const conversation = response.data.conversation;

      setCurrentConversation(conversation);
      setConversationId(conversation._id);

      return conversation;
    } catch (requestError) {
      console.error(
        "Open conversation error:",
        requestError.response?.data || requestError.message,
      );
      clearConversation();
      setCurrentConversation(null);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreConversation = useCallback(async () => {
    const conversationId = getConversationId();

    if (!conversationId) {
      return null;
    }

    const conversation = await openConversation(conversationId);

    if (!conversation) {
      clearConversation();
    }

    return conversation;
  }, [openConversation]);

  const createNewChat = useCallback(() => {
    clearConversation();
    setCurrentConversation(null);
  }, []);

  const renameConversation = useCallback(async (id, title) => {
    try {
      const response = await api.patch(`/api/chat/conversation/${id}/title`, {
        title: title.trim(),
        ...(!isLoggedIn() && {
          sessionId: getSessionId(),
        }),
      });
      const updated = response.data.conversation;

      setConversations((previous) =>
        previous.map((item) =>
          item._id === id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );
      setCurrentConversation((previous) =>
        previous?._id === id
          ? {
              ...previous,
              ...updated,
            }
          : previous,
      );

      return true;
    } catch (requestError) {
      console.error(
        "Rename error:",
        requestError.response?.data || requestError.message,
      );

      return false;
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await api.delete(`/api/chat/conversation/${id}`, {
        data: isLoggedIn()
          ? undefined
          : {
              sessionId: getSessionId(),
            },
      });

      setConversations((previous) =>
        previous.filter((item) => item._id !== id),
      );
      setCurrentConversation((previous) => {
        if (previous?._id === id) {
          clearConversation();
          return null;
        }

        return previous;
      });

      return true;
    } catch (requestError) {
      console.error(
        "Delete error:",
        requestError.response?.data || requestError.message,
      );

      return false;
    }
  }, []);

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
