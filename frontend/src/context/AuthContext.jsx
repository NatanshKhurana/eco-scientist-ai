import { useEffect, useState } from "react";

import useAuth from "../hooks/useAuth";
import {
  getUser,
  setUser,
  clearUser,
  clearConversationId,
} from "../utils/storage";
import { AuthContext } from "./authContextStore";

export const AuthProvider = ({ children }) => {
  const { login, signup, logout, getProfile, mergeGuestChats } = useAuth();
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const savedUser = getUser();

      if (!savedUser) {
        setLoading(false);
        return;
      }

      setUserState(savedUser);

      const profile = await getProfile();

      if (profile) {
        setUserState(profile);
        setUser(profile);
      } else {
        clearUser();
        setUserState(null);
      }

      setLoading(false);
    };

    void restore();
  }, [getProfile]);

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

  const handleLogout = async () => {
    await logout();
    clearUser();
    setUserState(null);
    clearConversationId();
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
