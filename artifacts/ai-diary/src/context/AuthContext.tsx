import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { googleLogout } from "@react-oauth/google";

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("aura_user");
    if (stored) {
      try {
        const parsed: AuthUser = JSON.parse(stored);
        setUser(parsed);
        // Keep fetch override in sync
        patchFetch(parsed.email, parsed.token);
      } catch {
        localStorage.removeItem("aura_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (u: AuthUser) => {
    localStorage.setItem("aura_user", JSON.stringify(u));
    // Legacy key for compatibility with existing hooks
    localStorage.setItem("userEmail", u.email);
    setUser(u);
    patchFetch(u.email, u.token);
  };

  const logout = () => {
    googleLogout();
    localStorage.removeItem("aura_user");
    localStorage.removeItem("userEmail");
    setUser(null);
    patchFetch("", "");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// Patch global fetch to inject auth headers on every request
let _currentEmail = "";
let _currentToken = "";

function patchFetch(email: string, token: string) {
  _currentEmail = email;
  _currentToken = token;
}

// Install the global interceptor once (idempotent via a flag)
if (!(window as any).__aureFetchPatched) {
  (window as any).__aureFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const headers = new Headers((init as RequestInit).headers);
    if (_currentEmail) headers.set("x-user-email", _currentEmail);
    if (_currentToken) headers.set("x-google-token", _currentToken);
    return originalFetch(input, { ...(init as RequestInit), headers });
  };
}
