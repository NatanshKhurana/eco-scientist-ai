import { useCallback } from "react";
import axios from "axios";

import { getSessionId } from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default function useAuth() {
  const login = useCallback(async (data) => {
    const response = await api.post("/api/auth/login", data);
    return response.data;
  }, []);

  const signup = useCallback(async (data) => {
    const response = await api.post("/api/auth/signup", data);
    return response.data;
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const response = await api.get("/api/users/profile");
      return response.data.user;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        return null;
      }

      console.error(
        "Profile Error:",
        requestError.response?.data || requestError.message,
      );

      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
      return true;
    } catch (requestError) {
      console.error(
        "Logout Error:",
        requestError.response?.data || requestError.message,
      );

      return false;
    }
  }, []);

  const mergeGuestChats = useCallback(async () => {
    try {
      const response = await api.post("/api/chat/merge", {
        sessionId: getSessionId(),
      });

      return response.data;
    } catch (requestError) {
      console.error(
        "Merge Guest Chat Error:",
        requestError.response?.data || requestError.message,
      );

      return false;
    }
  }, []);

  return {
    login,
    signup,
    logout,
    getProfile,
    mergeGuestChats,
  };
}
