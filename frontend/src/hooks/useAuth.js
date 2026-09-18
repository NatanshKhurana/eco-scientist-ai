import axios from "axios";

import { getSessionId } from "../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,

  withCredentials: true,
});

export default function useAuth() {
  // ==========================
  // Login
  // ==========================

  const login = async (data) => {
    try {
      const response = await api.post(
        "/api/users/login",

        data,
      );

      return response.data;
    } catch (error) {
      console.error(
        "Login Error:",

        error.response?.data || error.message,
      );

      throw error;
    }
  };

  // ==========================
  // Signup
  // ==========================

  const signup = async (data) => {
    try {
      const response = await api.post(
        "/api/users/signup",

        data,
      );

      return response.data;
    } catch (error) {
      console.error(
        "Signup Error:",

        error.response?.data || error.message,
      );

      throw error;
    }
  };

  // ==========================
  // Profile
  // ==========================

  const getProfile = async () => {
    try {
      const response = await api.get("/api/users/profile");

      return response.data.user;
    } catch (error) {
      // Guest user
      // no token

      if (error.response?.status === 401) {
        return null;
      }

      console.error(
        "Profile Error:",

        error.response?.data || error.message,
      );

      return null;
    }
  };

  // ==========================
  // Logout
  // ==========================

  const logout = async () => {
    try {
      await api.post("/api/users/logout");

      return true;
    } catch (error) {
      console.error(
        "Logout Error:",

        error.response?.data || error.message,
      );

      return false;
    }
  };

  // ==========================
  // Merge Guest Chats
  // ==========================

  const mergeGuestChats = async () => {
    try {
      const sessionId = getSessionId();

      if (!sessionId) {
        return false;
      }

      const response = await api.post(
        "/api/chat/merge",

        {
          sessionId,
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        "Merge Guest Chat Error:",

        error.response?.data || error.message,
      );

      return false;
    }
  };

  return {
    login,

    signup,

    logout,

    getProfile,

    mergeGuestChats,
  };
}
