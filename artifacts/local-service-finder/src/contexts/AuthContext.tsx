import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@workspace/api-client-react";

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem("lsf_token");
      const userStr = localStorage.getItem("lsf_user");
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
    } catch (e) {
      console.error("Failed to parse auth state", e);
    }
    return { user: null, token: null };
  });

  const login = (token: string, user: User) => {
    localStorage.setItem("lsf_token", token);
    localStorage.setItem("lsf_user", JSON.stringify(user));
    setAuthState({ token, user });
  };

  const logout = () => {
    localStorage.removeItem("lsf_token");
    localStorage.removeItem("lsf_user");
    setAuthState({ token: null, user: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAuthenticated: !!authState.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
