"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  username: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  needsUsername: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  username: null,
  isAdmin: false,
  isLoading: true,
  needsUsername: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  getToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.user) {
        setUsername(data.username);
        setIsAdmin(data.isAdmin);
        setNeedsUsername(!data.username);
      }
    } catch {
      // silently fail — user can still browse
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        fetchProfile(s.access_token).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        fetchProfile(s.access_token);
      } else {
        setUsername(null);
        setIsAdmin(false);
        setNeedsUsername(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUsername(null);
    setIsAdmin(false);
    setNeedsUsername(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = await getToken();
    if (token) await fetchProfile(token);
  }, [getToken, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user, session, username, isAdmin, isLoading, needsUsername,
      signOut, refreshProfile, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
