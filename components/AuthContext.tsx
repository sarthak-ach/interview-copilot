"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string, isMock?: boolean, email?: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authenticate user session on mount
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("interview-copilot-token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await apiFetch<User>("/api/users/me");
          setUser(profile);
        } catch (error) {
          console.error("Failed to load user profile, clearing session:", error);
          localStorage.removeItem("interview-copilot-token");
          localStorage.removeItem("interview-copilot-refresh-token");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    loadUser();

    // Listen for global unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth-unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{
        access_token: string;
        refresh_token: string;
        email: string;
        fullName: string;
      }>("/api/auth/login", {
        method: "POST",
        bodyData: { email, password },
      });

      localStorage.setItem("interview-copilot-token", response.access_token);
      localStorage.setItem("interview-copilot-refresh-token", response.refresh_token);
      
      setToken(response.access_token);
      setUser({
        id: "", // ID can be loaded via me profile later if needed or empty
        email: response.email,
        fullName: response.fullName,
      });

      // Query real profile to populate ID
      try {
        const profile = await apiFetch<User>("/api/users/me");
        setUser(profile);
      } catch (err) {
        // Fallback to response details
      }
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{
        access_token: string;
        refresh_token: string;
        email: string;
        fullName: string;
      }>("/api/auth/register", {
        method: "POST",
        bodyData: { fullName, email, password },
      });

      localStorage.setItem("interview-copilot-token", response.access_token);
      localStorage.setItem("interview-copilot-refresh-token", response.refresh_token);

      setToken(response.access_token);
      setUser({
        id: "",
        email: response.email,
        fullName: response.fullName,
      });

      // Query real profile to populate ID
      try {
        const profile = await apiFetch<User>("/api/users/me");
        setUser(profile);
      } catch (err) {
        // Fallback to response details
      }
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, isMock = false, email?: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{
        access_token: string;
        refresh_token: string;
        email: string;
        fullName: string;
      }>("/api/auth/google", {
        method: "POST",
        bodyData: { credential, isMock, email, fullName },
      });

      localStorage.setItem("interview-copilot-token", response.access_token);
      localStorage.setItem("interview-copilot-refresh-token", response.refresh_token);
      
      setToken(response.access_token);
      setUser({
        id: "",
        email: response.email,
        fullName: response.fullName,
      });

      try {
        const profile = await apiFetch<User>("/api/users/me");
        setUser(profile);
      } catch (err) {
        // Fallback
      }
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("interview-copilot-token");
    localStorage.removeItem("interview-copilot-refresh-token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
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
