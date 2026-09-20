import { useContext } from "react";

import { AuthContext } from "../context/authContextStore";

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be inside AuthProvider");
  }

  return context;
};
