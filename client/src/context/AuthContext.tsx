import { createContext, useContext, useState } from "react";
import { clearToken, isLoggedIn as hasStoredToken, setToken } from "../lib/auth";

// One source of truth for "is the admin logged in", so the nav, the route
// guard and the pages all react to login/logout together. The token itself
// stays in localStorage (lib/auth.ts) — this context mirrors its presence
// as React state so components re-render when it changes.

interface AuthContextValue {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(hasStoredToken());

  function login(token: string) {
    setToken(token);
    setLoggedIn(true);
  }

  function logout() {
    clearToken();
    setLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: loggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
