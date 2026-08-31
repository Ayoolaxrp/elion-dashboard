"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "staff" | "client" | "owner";

interface AuthUser {
  user: User;
  role: UserRole | null;
  organizationId: string | null;
  organizationName: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

interface AuthContextType {
  auth: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  auth: null,
  loading: true,
  error: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    async function loadSession() {
      try {
        const { data: { session } } = await sb!.auth.getSession();
        if (!session?.user) { setAuth(null); setLoading(false); return; }

        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setAuth({
            user: session.user,
            role: data.role,
            organizationId: data.organizationId,
            organizationName: data.organizationName,
            isSuperAdmin: data.isSuperAdmin,
            isAdmin: data.isAdmin,
            isClient: data.isClient,
          });
        } else {
          setAuth({
            user: session.user,
            role: "client",
            organizationId: null,
            organizationName: null,
            isSuperAdmin: false,
            isAdmin: false,
            isClient: true,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Auth error");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
    const { data: { subscription } } = sb!.auth.onAuthStateChange(() => { loadSession(); });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
