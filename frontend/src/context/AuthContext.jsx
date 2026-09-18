import { createContext, useContext, useEffect, useState } from "react";

import useAuth from "../hooks/useAuth";

import { getUser, setUser, clearUser } from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { login, signup, logout, getProfile, mergeGuestChats } = useAuth();

  const [user, setUserState] = useState(null);

  const [loading, setLoading] = useState(true);

  // ==========================
  // Restore User
  // ==========================

  useEffect(() => {
    const restore = async () => {
      const savedUser = getUser();

      if (!savedUser) {
        setLoading(false);

        return;
      }

      setUserState(savedUser);

      try {
        const profile = await getProfile();

        if (profile) {
          setUserState(profile);

          setUser(profile);
        }
      } catch (error) {
        clearUser();

        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  // ==========================
  // Login
  // ==========================

  const handleLogin = async (data) => {
    const response = await login(data);

    if (response?.user) {
      setUserState(response.user);

      setUser(response.user);

      await mergeGuestChats();

      window.dispatchEvent(new Event("conversationRefresh"));
    }

    return response;
  };

  // ==========================
  // Signup
  // ==========================

  const handleSignup = async (data) => {
    const response = await signup(data);

    if (response?.user) {
      setUserState(response.user);

      setUser(response.user);

      await mergeGuestChats();

      window.dispatchEvent(new Event("conversationRefresh"));
    }

    return response;
  };

  // ==========================
  // Logout
  // ==========================

  const handleLogout = async () => {
    await logout();

    clearUser();

    setUserState(null);

    // remove old conversation memory

    localStorage.removeItem("conversationId");

    window.dispatchEvent(new Event("conversationRefresh"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        login: handleLogin,

        signup: handleSignup,

        logout: handleLogout,

        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be inside AuthProvider");
  }

  return context;
};
