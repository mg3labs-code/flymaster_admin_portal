import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppUser } from "@/lib/types";
import { api, clearAuth, readStoredUser, setAuth } from "@/lib/api";
import { refreshStore } from "@/lib/store";

interface AuthValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  signOut: (redirect?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const stored = readStoredUser<AppUser>();
      if (stored) setUser(stored);
      try {
        const data = await api<{ user: AppUser }>("/me");
        setUser(data.user);
        await refreshStore();
      } catch {
        if (!stored) setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const data = await api<{ token: string; user: AppUser }>("/auth/signin", {
          method: "POST",
          auth: false,
          body: { email, password },
        });
        setAuth(data.token, data.user);
        setUser(data.user);
        await refreshStore();
      },
      signUp: async (input) => {
        if (input.password.length < 6) throw new Error("Password must be at least 6 characters");
        const data = await api<{ token: string; user: AppUser }>("/auth/signup", {
          method: "POST",
          auth: false,
          body: input,
        });
        setAuth(data.token, data.user);
        setUser(data.user);
        await refreshStore();
      },
      signOut: async (redirect = true) => {
        clearAuth();
        setUser(null);
        if (redirect) window.location.href = "/";
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
