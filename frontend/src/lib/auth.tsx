"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokens } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, portal: "student" | "admin") => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokens.access) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.get<User>("/auth/me/"));
    } catch {
      tokens.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = tokens.access ? api.get<User>("/auth/me/") : Promise.resolve(null);
    load
      .then((u) => !cancelled && setUser(u))
      .catch(() => tokens.clear())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const login: AuthState["login"] = async (email, password, portal) => {
    const path = portal === "admin" ? "/auth/admin-login/" : "/auth/login/";
    const data = await api.post<AuthResponse>(path, { email, password });
    tokens.set(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  };

  const register: AuthState["register"] = async (payload) => {
    const data = await api.post<AuthResponse>("/auth/register/", payload);
    tokens.set(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    tokens.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
