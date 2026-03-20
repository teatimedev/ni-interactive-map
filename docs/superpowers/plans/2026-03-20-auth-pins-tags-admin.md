# Auth, Pins, Tags & Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth (email+password, magic link, guest), tie pins/tags to user accounts, and provide admin moderation (inline delete + admin dashboard).

**Architecture:** Supabase Auth for identity with three sign-up paths. AuthProvider context wraps the app. API routes verify JWT server-side. Pins and tags get user_id/username columns. Admin detected via ADMIN_EMAILS env var. RLS policies for defense-in-depth.

**Tech Stack:** Next.js 16 (App Router), Supabase Auth + RLS, React Context, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-auth-pins-tags-admin-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `lib/auth.ts` | Server-side auth helper: verify JWT, check admin, check email confirmed. Uses supabaseServer (service role) which bypasses RLS — API routes are the primary authorization gate, RLS is defense-in-depth only. |
| `lib/api-utils.ts` | Shared utilities: hashIp, getClientIp, BLOCKED_WORDS, validateLabel |
| `hooks/useAuth.tsx` | AuthProvider context + useAuth hook (client-side auth state) |
| `components/AuthModal.tsx` | Login/signup modal with email+password, magic link, guest |
| `components/UsernamePicker.tsx` | Full-screen overlay for first-login username selection |
| `components/UserPill.tsx` | Small logged-in user indicator (username + sign out) |
| `app/api/auth/me/route.ts` | GET: returns { user, username, isAdmin } |
| `app/api/profile/route.ts` | POST: create username in profiles table (insert only — usernames are immutable) |
| `app/api/admin/pins/route.ts` | Admin-only: list all pins with filters, bulk delete |
| `app/api/admin/tags/route.ts` | Admin-only: list all tags with filters, bulk delete |
| `app/admin/page.tsx` | Admin dashboard page |
| `app/admin/layout.tsx` | Admin layout with protection redirect |

### Modified files
| File | Changes |
|------|---------|
| `lib/supabase.ts` | Add supabaseServer (service role client) export |
| `app/layout.tsx` | Wrap children with AuthProvider |
| `app/api/pins/route.ts` | Add auth to POST, add DELETE handler, expand GET select, use shared utils |
| `app/api/tags/route.ts` | Add auth to POST, add DELETE handler, expand GET select, use shared utils |
| `components/MapApp.tsx` | Add auth-gated pin/tag buttons, sign-in button, UserPill, UsernamePicker |
| `components/Map/PinLayer.tsx` | Show username on pins, add delete button for owner/admin |
| `components/Map/PinCreator.tsx` | Send auth token with requests |
| `components/ui/WardTags.tsx` | Show username on tags, add delete for owner/admin, require auth to add |

---

## Task 1: Shared utilities — extract duplicated code

**Files:**
- Create: `lib/api-utils.ts`
- Modify: `app/api/pins/route.ts`
- Modify: `app/api/tags/route.ts`

- [ ] **Step 1: Create `lib/api-utils.ts`**

Extract the shared functions that are currently duplicated in both API routes:

```typescript
// lib/api-utils.ts
import crypto from "crypto";
import { NextRequest } from "next/server";

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "ni-map-salt").digest("hex").slice(0, 16);
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const BLOCKED_WORDS = [
  "fuck", "shit", "cunt", "nigger", "faggot", "retard", "spastic",
  "kill", "bomb", "rape", "nazi", "kys",
];

export function validateLabel(label: string): { valid: boolean; error?: string } {
  const trimmed = label.trim();
  if (trimmed.length < 3) return { valid: false, error: "Label must be at least 3 characters" };
  if (trimmed.length > 50) return { valid: false, error: "Label must be at most 50 characters" };
  if (!/^[a-zA-Z0-9\s'!?.,()-]+$/.test(trimmed)) {
    return { valid: false, error: "Letters, numbers, spaces and basic punctuation only" };
  }
  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return { valid: false, error: "Label contains inappropriate content" };
  }
  return { valid: true };
}
```

- [ ] **Step 2: Update `app/api/pins/route.ts` to import from shared utils**

Remove the local `hashIp`, `getClientIp`, `BLOCKED_WORDS`, `validateLabel` definitions. Replace with:

```typescript
import { hashIp, getClientIp, validateLabel } from "@/lib/api-utils";
```

- [ ] **Step 3: Update `app/api/tags/route.ts` to import from shared utils**

Remove the local `hashIp`, `getClientIp` definitions. Replace with:

```typescript
import { hashIp, getClientIp } from "@/lib/api-utils";
```

- [ ] **Step 4: Verify build passes**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add lib/api-utils.ts app/api/pins/route.ts app/api/tags/route.ts
git commit -m "refactor: extract shared API utilities into lib/api-utils"
```

---

## Task 2: Supabase server client + auth helper

**Files:**
- Modify: `lib/supabase.ts`
- Create: `lib/auth.ts`

- [ ] **Step 1: Add server client to `lib/supabase.ts`**

Add below the existing client export:

```typescript
// Server-side client with service role key (for JWT verification and admin operations)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseServer = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
```

- [ ] **Step 2: Create `lib/auth.ts`**

```typescript
// lib/auth.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

interface AuthResult {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  isAnonymous: boolean;
  emailConfirmed: boolean;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function getAuthUser(request: NextRequest): Promise<AuthResult | null> {
  if (!supabaseServer) return null;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;

  const email = user.email ?? null;
  const isAdmin = email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false;
  const isAnonymous = user.is_anonymous ?? false;
  const emailConfirmed = isAnonymous || !!user.email_confirmed_at;

  return { userId: user.id, email, isAdmin, isAnonymous, emailConfirmed };
}

/**
 * Helper to enforce that email+password users have confirmed their email.
 * Guest/anonymous users skip this check.
 */
export function requireConfirmed(auth: AuthResult): string | null {
  if (!auth.emailConfirmed) {
    return "Please confirm your email before creating content";
  }
  return null;
}
```

- [ ] **Step 3: Add `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS` to `.env.local`**

Append to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ADMIN_EMAILS=your-email@example.com
```

- [ ] **Step 4: Verify build passes**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add lib/supabase.ts lib/auth.ts
git commit -m "feat: add server-side Supabase client and auth helper"
```

---

## Task 3: Database migrations — profiles table + new columns

**Files:**
- Supabase SQL migrations (run in Supabase dashboard or via CLI)

- [ ] **Step 1: Create profiles table**

Run this SQL in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 20),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Add user_id and username columns to map_pins**

```sql
ALTER TABLE map_pins ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE map_pins ADD COLUMN username TEXT;
```

- [ ] **Step 3: Add user_id and username columns to ward_tags**

```sql
ALTER TABLE ward_tags ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ward_tags ADD COLUMN username TEXT;

-- Ensure ward_tags has report columns (may already exist — use IF NOT EXISTS pattern)
DO $$ BEGIN
  ALTER TABLE ward_tags ADD COLUMN report_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE ward_tags ADD COLUMN reported BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
```

- [ ] **Step 4: Apply RLS policies for pins and tags**

```sql
-- map_pins RLS
ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pins"
  ON map_pins FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pins"
  ON map_pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pins"
  ON map_pins FOR DELETE
  USING (auth.uid() = user_id);

-- ward_tags RLS
ALTER TABLE ward_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags"
  ON ward_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON ward_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON ward_tags FOR DELETE
  USING (auth.uid() = user_id);
```

- [ ] **Step 5: Verify — check that existing pins and tags are still readable**

Run a quick test in Supabase SQL Editor:
```sql
SELECT count(*) FROM map_pins;
SELECT count(*) FROM ward_tags;
```
Expected: Same counts as before migration

---

## Task 4: Profile API endpoint

**Files:**
- Create: `app/api/profile/route.ts`

- [ ] **Step 1: Create profile endpoint**

```typescript
// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { BLOCKED_WORDS } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username } = body;

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const trimmed = username.trim();

  // Validate format: 3-20 chars, alphanumeric + underscores
  if (trimmed.length < 3 || trimmed.length > 20) {
    return NextResponse.json({ error: "Username must be 3-20 characters" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return NextResponse.json({ error: "Letters, numbers and underscores only" }, { status: 400 });
  }

  // Check blocked words
  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return NextResponse.json({ error: "Username contains inappropriate content" }, { status: 400 });
    }
  }

  // Check if user already has a username (immutable once set)
  const { data: existingProfile } = await supabaseServer
    .from("profiles")
    .select("username")
    .eq("user_id", auth.userId)
    .single();

  if (existingProfile) {
    return NextResponse.json({ error: "Username already set and cannot be changed" }, { status: 409 });
  }

  // Check username uniqueness
  const { data: taken } = await supabaseServer
    .from("profiles")
    .select("user_id")
    .eq("username", trimmed)
    .single();

  if (taken) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  // Insert profile (not upsert — usernames are immutable)
  const { error } = await supabaseServer
    .from("profiles")
    .insert({ user_id: auth.userId, username: trimmed });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ username: trimmed });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/route.ts
git commit -m "feat: add profile API endpoint for username creation"
```

---

## Task 5: Auth/me API endpoint

**Files:**
- Create: `app/api/auth/me/route.ts`

- [ ] **Step 1: Create auth/me endpoint**

```typescript
// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ user: null });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ user: null });
  }

  // Fetch username from profiles
  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("username")
    .eq("user_id", auth.userId)
    .single();

  return NextResponse.json({
    user: { id: auth.userId, email: auth.email },
    username: profile?.username ?? null,
    isAdmin: auth.isAdmin,
  });
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx next build`

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/me/route.ts
git commit -m "feat: add /api/auth/me endpoint for client-side auth state"
```

---

## Task 6: AuthProvider context + useAuth hook

**Files:**
- Create: `hooks/useAuth.tsx`

- [ ] **Step 1: Create AuthProvider and useAuth**

```typescript
// hooks/useAuth.tsx
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
```

- [ ] **Step 2: Wrap app with AuthProvider in `app/layout.tsx`**

Modify `app/layout.tsx` — add only the AuthProvider import and wrap children. **Preserve all existing exports** (metadata, viewport):

```typescript
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

// metadata and viewport exports stay exactly as they are — do not remove them

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

**Important:** Keep the existing `export const metadata: Metadata = { ... }` and `export const viewport: Viewport = { ... }` exactly as they are. Only change is wrapping `{children}` with `<AuthProvider>`.

- [ ] **Step 3: Verify build passes**

Run: `npx next build`

- [ ] **Step 4: Commit**

```bash
git add hooks/useAuth.tsx app/layout.tsx
git commit -m "feat: add AuthProvider context and useAuth hook"
```

---

## Task 7: Auth UI — modal, username picker, user pill

**Files:**
- Create: `components/AuthModal.tsx`
- Create: `components/UsernamePicker.tsx`
- Create: `components/UserPill.tsx`

- [ ] **Step 1: Create AuthModal**

Login/signup modal with three paths: email+password, magic link, continue as guest.

```typescript
// components/AuthModal.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  onClose: () => void;
}

type Tab = "signin" | "signup";

export default function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!supabase || !email || !password) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else onClose();
    setLoading(false);
  }

  async function handleSignUp() {
    if (!supabase || !email || !password) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    else {
      setMessage("Check your email for a verification link!");
      setTimeout(onClose, 3000);
    }
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!supabase || !email) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    if (err) setError(err.message);
    else setMessage("Check your email for the login link!");
    setLoading(false);
  }

  async function handleGuest() {
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInAnonymously();
    if (err) setError(err.message);
    else onClose();
    setLoading(false);
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>&times;</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "signin" ? "active" : ""}`}
            onClick={() => { setTab("signin"); setError(""); setMessage(""); }}
          >
            Sign in
          </button>
          <button
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); setMessage(""); }}
          >
            Sign up
          </button>
        </div>

        <div className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="auth-input"
            onKeyDown={(e) => { if (e.key === "Enter") tab === "signin" ? handleSignIn() : handleSignUp(); }}
          />
          {tab === "signup" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="auth-input"
              onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }}
            />
          )}

          <button
            className="auth-btn auth-btn-primary"
            onClick={tab === "signin" ? handleSignIn : handleSignUp}
            disabled={loading || !email || !password}
          >
            {loading ? "Loading..." : tab === "signin" ? "Sign in" : "Sign up"}
          </button>

          {tab === "signin" && (
            <button
              className="auth-btn auth-btn-secondary"
              onClick={handleMagicLink}
              disabled={loading || !email}
            >
              Send magic link instead
            </button>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            className="auth-btn auth-btn-guest"
            onClick={handleGuest}
            disabled={loading}
          >
            Continue as guest
          </button>
          <p className="auth-guest-note">No email needed — pick a username and go. You won't be able to recover this account.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create UsernamePicker**

```typescript
// components/UsernamePicker.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function UsernamePicker() {
  const { needsUsername, getToken, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!needsUsername) return null;

  async function handleSubmit() {
    if (username.trim().length < 3) return;
    setLoading(true);
    setError("");

    const token = await getToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshProfile();
      } else {
        setError(data.error || "Failed to set username");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="username-picker-overlay">
      <div className="username-picker">
        <h2>Pick a display name</h2>
        <p>This will show on your pins and tags.</p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.slice(0, 20).replace(/[^a-zA-Z0-9_]/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="your_username"
          autoFocus
          disabled={loading}
          className="auth-input"
        />
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {username.length}/20 — letters, numbers, underscores only
        </div>
        <button
          className="auth-btn auth-btn-primary"
          onClick={handleSubmit}
          disabled={loading || username.trim().length < 3}
          style={{ marginTop: 12 }}
        >
          {loading ? "Saving..." : "Let's go"}
        </button>
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create UserPill**

```typescript
// components/UserPill.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function UserPill() {
  const { username, signOut } = useAuth();

  if (!username) return null;

  return (
    <div className="user-pill">
      <span className="user-pill-name">{username}</span>
      <button className="user-pill-signout" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify build passes**

Run: `npx next build`

- [ ] **Step 5: Commit**

```bash
git add components/AuthModal.tsx components/UsernamePicker.tsx components/UserPill.tsx
git commit -m "feat: add auth UI components — modal, username picker, user pill"
```

---

## Task 8: Add CSS for auth components

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add auth-related styles to `app/globals.css`**

Append to the end of globals.css:

```css
/* ── Auth Modal ── */
.auth-modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.auth-modal {
  background: var(--bg-card); border: 1px solid var(--card-border);
  border-radius: 12px; padding: 28px; width: 340px; max-width: 90vw;
  position: relative;
}
.auth-modal-close {
  position: absolute; top: 10px; right: 14px;
  background: none; border: none; color: var(--text-secondary);
  font-size: 22px; cursor: pointer; line-height: 1;
}
.auth-tabs {
  display: flex; gap: 0; margin-bottom: 18px;
  border-bottom: 1px solid var(--border-medium);
}
.auth-tab {
  flex: 1; padding: 8px 0; background: none; border: none;
  color: var(--text-secondary); font-size: 13px; cursor: pointer;
  border-bottom: 2px solid transparent; font-family: inherit;
}
.auth-tab.active {
  color: var(--text-primary); border-bottom-color: var(--accent-light);
}
.auth-form { display: flex; flex-direction: column; gap: 10px; }
.auth-input {
  background: var(--bg-control); border: 1px solid var(--border-medium);
  border-radius: 8px; padding: 10px 12px; color: var(--text-primary);
  font-size: 13px; font-family: inherit; outline: none; width: 100%;
  box-sizing: border-box;
}
.auth-input:focus { border-color: var(--accent-light); }
.auth-btn {
  padding: 10px; border-radius: 8px; font-size: 13px;
  font-family: inherit; cursor: pointer; border: none; width: 100%;
}
.auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.auth-btn-primary {
  background: var(--accent-light); color: #000; font-weight: 600;
}
.auth-btn-secondary {
  background: none; color: var(--text-secondary);
  border: 1px solid var(--border-medium);
}
.auth-btn-guest {
  background: var(--bg-control); color: var(--text-primary);
  border: 1px solid var(--border-medium);
}
.auth-divider {
  display: flex; align-items: center; gap: 12px;
  color: var(--text-muted); font-size: 11px; margin: 4px 0;
}
.auth-divider::before, .auth-divider::after {
  content: ""; flex: 1; border-top: 1px solid var(--border-medium);
}
.auth-guest-note {
  font-size: 10px; color: var(--text-muted); text-align: center;
  margin: 0; line-height: 1.4;
}
.auth-error { color: var(--negative); font-size: 12px; margin-top: 8px; }
.auth-success { color: var(--positive); font-size: 12px; margin-top: 8px; }

/* ── Username Picker ── */
.username-picker-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
}
.username-picker {
  background: var(--bg-card); border: 1px solid var(--card-border);
  border-radius: 12px; padding: 32px; width: 340px; max-width: 90vw;
  text-align: center;
}
.username-picker h2 {
  margin: 0 0 6px; font-size: 18px; color: var(--text-primary);
}
.username-picker p {
  margin: 0 0 16px; font-size: 12px; color: var(--text-secondary);
}

/* ── User Pill ── */
.user-pill {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-control); border: 1px solid var(--border-medium);
  border-radius: 20px; padding: 4px 10px 4px 12px;
  font-size: 12px;
}
.user-pill-name { color: var(--text-primary); font-weight: 500; }
.user-pill-signout {
  background: none; border: none; color: var(--text-muted);
  font-size: 11px; cursor: pointer; font-family: inherit;
  padding: 2px 4px;
}
.user-pill-signout:hover { color: var(--text-secondary); }
```

- [ ] **Step 2: Verify build passes**

Run: `npx next build`

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add CSS for auth modal, username picker, and user pill"
```

---

## Task 9: Integrate auth into MapApp

**Files:**
- Modify: `components/MapApp.tsx`

- [ ] **Step 1: Add auth imports and state to MapApp**

At the top of MapApp.tsx, add:

```typescript
import { useAuth } from "@/hooks/useAuth";
import UserPill from "@/components/UserPill";
import UsernamePicker from "@/components/UsernamePicker";
```

Dynamically import AuthModal:
```typescript
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
```

- [ ] **Step 2: Add auth state and modal toggle inside MapApp component**

Inside the component, add:

```typescript
const { user, username, isLoading: authLoading } = useAuth();
const [showAuthModal, setShowAuthModal] = useState(false);
```

- [ ] **Step 3: Gate pin mode behind auth**

Modify `handleTogglePinMode` to check auth:

```typescript
function handleTogglePinMode() {
  if (!user) {
    setShowAuthModal(true);
    return;
  }
  if (comparison.isComparing) comparison.toggleCompareMode();
  togglePinMode();
}
```

- [ ] **Step 4: Add UserPill and Sign In button to the nav**

In the `top-nav-right` div, before the capsule with Compare/Drop Pin buttons, add:

```tsx
{user && username ? (
  <UserPill />
) : (
  <button
    className="capsule-btn"
    onClick={() => setShowAuthModal(true)}
    style={{ background: "var(--bg-control)", border: "1px solid var(--border-medium)", borderRadius: 20, padding: "4px 12px", fontSize: 12 }}
  >
    Sign in
  </button>
)}
```

- [ ] **Step 5: Add AuthModal and UsernamePicker to JSX**

At the end of the return, before the closing `</div>`:

```tsx
{showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
<UsernamePicker />
```

- [ ] **Step 6: Verify build passes**

Run: `npx next build`

- [ ] **Step 7: Commit**

```bash
git add components/MapApp.tsx
git commit -m "feat: integrate auth into MapApp — sign in button, gated pin mode"
```

---

## Task 10: Update pins API — auth, delete, expanded GET

**Files:**
- Modify: `app/api/pins/route.ts`

- [ ] **Step 1: Update GET to include username and user_id**

Change the select in the GET handler:

```typescript
.select("id, lat, lng, label, username, user_id, created_at")
```

Also filter out reported pins:

```typescript
.eq("reported", false)
```

- [ ] **Step 2: Update POST to require auth and store user info**

Add import at top:
```typescript
import { getAuthUser, requireConfirmed } from "@/lib/auth";
```

In the POST handler, after the supabase check, add auth verification:

```typescript
const auth = await getAuthUser(request);
if (!auth) {
  return NextResponse.json({ error: "Sign in to drop pins" }, { status: 401 });
}

// Block unconfirmed email+password users
const confirmError = requireConfirmed(auth);
if (confirmError) {
  return NextResponse.json({ error: confirmError }, { status: 403 });
}

// Fetch username from profiles
const { data: profile } = await supabaseServer
  .from("profiles")
  .select("username")
  .eq("user_id", auth.userId)
  .single();

if (!profile?.username) {
  return NextResponse.json({ error: "Set a username first" }, { status: 403 });
}
```

Add import for supabaseServer:
```typescript
import { supabase, supabaseServer } from "@/lib/supabase";
```

Update rate limiting to use both user_id AND IP:

```typescript
// Rate limit by user (3/hour)
const { count: userCount } = await supabase
  .from("map_pins")
  .select("*", { count: "exact", head: true })
  .eq("user_id", auth.userId)
  .gte("created_at", oneHourAgo);

if ((userCount ?? 0) >= 3) {
  return NextResponse.json({ error: "Rate limit: 3 pins per hour. Try later." }, { status: 429 });
}

// Secondary IP rate limit (prevents guest account spam)
const { count: ipCount } = await supabase
  .from("map_pins")
  .select("*", { count: "exact", head: true })
  .eq("ip_hash", ipHash)
  .gte("created_at", oneHourAgo);

if ((ipCount ?? 0) >= 5) {
  return NextResponse.json({ error: "Rate limit exceeded. Try later." }, { status: 429 });
}
```

Update the insert to include user_id and username:

```typescript
.insert({
  lat,
  lng,
  label: label.trim(),
  ip_hash: ipHash,
  user_id: auth.userId,
  username: profile.username,
})
```

- [ ] **Step 3: Add DELETE handler**

```typescript
// DELETE /api/pins — delete a pin (owner or admin)
export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing pin id" }, { status: 400 });
  }

  // Check ownership or admin
  if (!auth.isAdmin) {
    const { data: pin } = await supabaseServer
      .from("map_pins")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!pin || pin.user_id !== auth.userId) {
      return NextResponse.json({ error: "Not authorized to delete this pin" }, { status: 403 });
    }
  }

  const { error } = await supabaseServer
    .from("map_pins")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Verify build passes**

Run: `npx next build`

- [ ] **Step 5: Commit**

```bash
git add app/api/pins/route.ts
git commit -m "feat: add auth to pins API — require login, add DELETE, dual rate limit"
```

---

## Task 11: Update tags API — auth, delete, expanded GET

**Files:**
- Modify: `app/api/tags/route.ts`

- [ ] **Step 1: Update GET to include username and user_id**

Change the select:

```typescript
.select("id, tag, category, username, user_id")
```

Update the aggregation to carry through user info:

```typescript
interface TagRow { id: number; tag: string; category: string; username: string | null; user_id: string | null; }

const tagMap = new Map<string, { count: number; category: string; usernames: string[]; ids: number[]; user_ids: string[] }>();
for (const row of (data as TagRow[]) ?? []) {
  const existing = tagMap.get(row.tag);
  if (existing) {
    existing.count++;
    if (row.username && !existing.usernames.includes(row.username)) existing.usernames.push(row.username);
    existing.ids.push(row.id);
    if (row.user_id) existing.user_ids.push(row.user_id);
  } else {
    tagMap.set(row.tag, {
      count: 1,
      category: row.category,
      usernames: row.username ? [row.username] : [],
      ids: [row.id],
      user_ids: row.user_id ? [row.user_id] : [],
    });
  }
}

const tags = [...tagMap.entries()]
  .map(([tag, { count, category, usernames, ids, user_ids }]) => ({ tag, count, category, usernames, ids, user_ids }))
  .sort((a, b) => b.count - a.count);
```

- [ ] **Step 2: Update POST to require auth**

Add imports:
```typescript
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
```

After the supabase check in POST, add:

```typescript
const auth = await getAuthUser(request);
if (!auth) {
  return NextResponse.json({ error: "Sign in to add tags" }, { status: 401 });
}

const { data: profile } = await supabaseServer!
  .from("profiles")
  .select("username")
  .eq("user_id", auth.userId)
  .single();

if (!profile?.username) {
  return NextResponse.json({ error: "Set a username first" }, { status: 403 });
}
```

Update rate limit to use user_id + IP dual check (same pattern as pins).

Update duplicate check to use user_id instead of ip_hash:
```typescript
.eq("user_id", auth.userId)
```

Update insert to include user_id and username:
```typescript
.insert({
  ward_slug: ward,
  lgd_slug: lgd,
  tag: category === "custom" ? tag.trim() : tag,
  category,
  ip_hash: ipHash,
  user_id: auth.userId,
  username: profile.username,
})
```

- [ ] **Step 3: Add DELETE handler**

```typescript
export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing tag id" }, { status: 400 });
  }

  if (!auth.isAdmin) {
    const { data: tag } = await supabaseServer
      .from("ward_tags")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!tag || tag.user_id !== auth.userId) {
      return NextResponse.json({ error: "Not authorized to delete this tag" }, { status: 403 });
    }
  }

  const { error } = await supabaseServer
    .from("ward_tags")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Verify build passes**

Run: `npx next build`

- [ ] **Step 5: Commit**

```bash
git add app/api/tags/route.ts
git commit -m "feat: add auth to tags API — require login, add DELETE, dual rate limit"
```

---

## Task 12: Update PinLayer — show username, delete button

**Files:**
- Modify: `components/Map/PinLayer.tsx`

- [ ] **Step 1: Update Pin interface and icon**

Update the interface:

```typescript
interface Pin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  username: string | null;
  user_id: string | null;
  created_at: string;
}
```

Update the pin icon to show username:

```typescript
function createPinIcon(username: string | null) {
  return new L.DivIcon({
    className: "",
    html: `<div class="pin-marker-icon"></div>${username ? `<div class="pin-username-label">${username}</div>` : ""}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}
```

- [ ] **Step 2: Add delete support to pin popup**

Import useAuth:
```typescript
import { useAuth } from "@/hooks/useAuth";
```

Add auth to the component:
```typescript
const { user, isAdmin, getToken } = useAuth();
```

Add delete handler:
```typescript
async function handleDelete(id: number) {
  const token = await getToken();
  if (!token) return;
  try {
    await fetch("/api/pins", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    fetchPins();
  } catch {
    // silently fail
  }
}
```

Update the Marker/Popup JSX to show username and conditional delete:

```tsx
<Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createPinIcon(pin.username)}>
  <Popup>
    <div className="pin-popup-label">{pin.label}</div>
    {pin.username && <div className="pin-popup-user">by {pin.username}</div>}
    <div className="pin-popup-time">{timeAgo(pin.created_at)}</div>
    <div className="pin-popup-actions">
      <button className="pin-popup-report" onClick={() => handleReport(pin.id)}>Report</button>
      {(isAdmin || (user && pin.user_id === user.id)) && (
        <button className="pin-popup-delete" onClick={() => handleDelete(pin.id)}>Delete</button>
      )}
    </div>
  </Popup>
</Marker>
```

- [ ] **Step 3: Add CSS for pin username label and delete button**

Append to `app/globals.css`:

```css
/* ── Pin username label ── */
.pin-username-label {
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  font-size: 9px; color: #ccc; white-space: nowrap;
  background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 3px;
  pointer-events: none; margin-top: 2px;
}
.pin-popup-user { font-size: 10px; color: #888; margin-bottom: 2px; }
.pin-popup-actions { display: flex; gap: 6px; margin-top: 4px; }
.pin-popup-delete {
  font-size: 10px; color: var(--negative); background: none;
  border: 1px solid var(--negative); border-radius: 4px;
  padding: 2px 6px; cursor: pointer; font-family: inherit;
}
```

- [ ] **Step 4: Verify build passes**

Run: `npx next build`

- [ ] **Step 5: Commit**

```bash
git add components/Map/PinLayer.tsx app/globals.css
git commit -m "feat: show username on pins, add delete button for owner/admin"
```

---

## Task 13: Update PinCreator — send auth token

**Files:**
- Modify: `components/Map/PinCreator.tsx`

- [ ] **Step 1: Add auth to PinCreator**

Import useAuth:
```typescript
import { useAuth } from "@/hooks/useAuth";
```

Add inside the component:
```typescript
const { getToken } = useAuth();
```

Update handleSubmit to send auth token:

```typescript
async function handleSubmit() {
  if (label.trim().length < 3) return;
  setSubmitting(true);
  setError("");
  try {
    const token = await getToken();
    const res = await fetch("/api/pins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ lat, lng, label: label.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      onCreated();
    } else {
      setError(data.error || "Failed to drop pin");
    }
  } catch {
    setError("Network error");
  }
  setSubmitting(false);
}
```

- [ ] **Step 2: Verify build passes**

Run: `npx next build`

- [ ] **Step 3: Commit**

```bash
git add components/Map/PinCreator.tsx
git commit -m "feat: send auth token from PinCreator"
```

---

## Task 14: Update WardTags — auth, delete, show username

**Files:**
- Modify: `components/ui/WardTags.tsx`

- [ ] **Step 1: Add auth and update tag interface**

Import useAuth:
```typescript
import { useAuth } from "@/hooks/useAuth";
```

Update TagCount interface:
```typescript
interface TagCount {
  tag: string;
  count: number;
  category: string;
  usernames: string[];
  ids: number[];
  user_ids: string[];
}
```

Add inside the component:
```typescript
const { user, isAdmin, getToken } = useAuth();
```

- [ ] **Step 2: Gate "Add a tag" behind auth**

Replace the add tag button with an auth-gated version:

```tsx
{!showPicker && (
  <button
    className="btn-map"
    style={{ fontSize: 11, padding: "5px 10px" }}
    onClick={() => {
      if (!user) {
        setMessage("Sign in to add tags");
        setTimeout(() => setMessage(""), 3000);
        return;
      }
      setShowPicker(true);
    }}
  >
    + Add a tag
  </button>
)}
```

- [ ] **Step 3: Send auth token with tag creation**

Update `handleAddTag` to send the token:

```typescript
async function handleAddTag(tag: string, category: TagCategory) {
  setSubmitting(true);
  setMessage("");
  try {
    const token = await getToken();
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ lgd: lgdSlug, ward: wardSlug, tag, category }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Tagged!");
      setShowPicker(false);
      setCustomTag("");
      fetchTags();
    } else {
      setMessage(data.error || "Failed");
    }
  } catch {
    setMessage("Network error");
  }
  setSubmitting(false);
  setTimeout(() => setMessage(""), 3000);
}
```

- [ ] **Step 4: Add delete button on tag chips**

Add delete handler:

```typescript
async function handleDeleteTag(id: number) {
  const token = await getToken();
  if (!token) return;
  try {
    await fetch("/api/tags", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    fetchTags();
  } catch {
    // silently fail
  }
}
```

Update tag chip rendering to show username tooltip and delete button:

```tsx
{tags.map((t) => (
  <span
    key={t.tag}
    title={t.usernames.length > 0 ? `by ${t.usernames.join(", ")}` : undefined}
    style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 12, fontSize: 11,
      background: `${CATEGORY_COLORS[t.category] ?? "#555"}20`,
      border: `1px solid ${CATEGORY_COLORS[t.category] ?? "#555"}40`,
      color: "#ccc",
    }}
  >
    {t.tag}
    <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>{t.count}</span>
    {(isAdmin || (user && t.user_ids.includes(user.id))) && t.ids.length > 0 && (
      <button
        onClick={() => handleDeleteTag(t.ids[t.ids.length - 1])}
        style={{
          background: "none", border: "none", color: "#888",
          cursor: "pointer", fontSize: 12, padding: "0 0 0 2px", lineHeight: 1,
        }}
        title="Delete tag"
      >
        &times;
      </button>
    )}
  </span>
))}
```

- [ ] **Step 5: Verify build passes**

Run: `npx next build`

- [ ] **Step 6: Commit**

```bash
git add components/ui/WardTags.tsx
git commit -m "feat: add auth to WardTags — require login, show username, add delete"
```

---

## Task 15: Admin API endpoints

**Files:**
- Create: `app/api/admin/pins/route.ts`
- Create: `app/api/admin/tags/route.ts`

- [ ] **Step 1: Create admin pins endpoint**

```typescript
// app/api/admin/pins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const reported = searchParams.get("reported") === "true";
  const search = searchParams.get("search") ?? "";

  let query = supabaseServer
    .from("map_pins")
    .select("id, lat, lng, label, username, user_id, report_count, reported, created_at")
    .order("report_count", { ascending: false })
    .limit(500);

  if (reported) query = query.eq("reported", true);
  if (search) query = query.ilike("username", `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pins: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("map_pins")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
```

- [ ] **Step 2: Create admin tags endpoint**

```typescript
// app/api/admin/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const reported = searchParams.get("reported") === "true";
  const search = searchParams.get("search") ?? "";

  let query = supabaseServer
    .from("ward_tags")
    .select("id, tag, category, ward_slug, lgd_slug, username, user_id, report_count, reported, created_at")
    .order("report_count", { ascending: false })
    .limit(500);

  if (reported) query = query.eq("reported", true);
  if (search) query = query.ilike("username", `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tags: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("ward_tags")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
```

- [ ] **Step 3: Verify build passes**

Run: `npx next build`

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/pins/route.ts app/api/admin/tags/route.ts
git commit -m "feat: add admin API endpoints for pins and tags management"
```

---

## Task 16: Admin dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create admin layout with protection**

```typescript
// app/admin/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1a1a1a", color: "#888" }}>
        Loading...
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
```

- [ ] **Step 2: Create admin page**

The admin page has two tabs (Pins, Tags), a table with filters/search, and bulk delete. Full code for `app/admin/page.tsx` — see the spec for the exact UI requirements. The page fetches from `/api/admin/pins` and `/api/admin/tags` (created in Task 15), displays results in a table sorted by report count, allows filtering by "reported only" or searching by username, and supports bulk select + delete.

Create `app/admin/page.tsx` with the following structure:
- `"use client"` component
- Uses `useAuth()` for `getToken`
- State: `tab` (pins/tags), `pins[]`, `tags[]`, `filter`, `search`, `selected` Set, `loading`
- `fetchData()` — GET from admin API with auth header, applies filter/search params
- `handleBulkDelete()` — DELETE to admin API with `{ ids: [...selected] }`
- Table with checkbox column, content, username, report count, created date
- Rows highlighted red when reported
- "Delete N selected" button appears when items are checked

- [ ] **Step 3: Verify build passes**

Run: `npx next build`

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat: add admin dashboard with pin/tag management"
```

---

## Task 17: Final integration test — verify everything works together

- [ ] **Step 1: Start dev server and verify**

Run: `npm run dev`

Manual verification checklist:
1. Map loads normally — all districts, wards, stats still work
2. "Sign in" button appears in top nav
3. Click "Sign in" → modal appears with sign in/sign up/guest options
4. Sign up with email + password → verification email sent
5. Continue as guest → username picker appears
6. Pick username → user pill shows in nav
7. Drop pin → requires auth, pin shows with username
8. Add tag to ward → requires auth, tag shows with username
9. Own pin popup shows "Delete" button
10. Sign out → user pill disappears, pin/tag buttons work but require login
11. Navigate to /admin as admin → dashboard loads with pins/tags tables
12. Navigate to /admin as non-admin → redirects to home

- [ ] **Step 2: Verify build passes**

Run: `npx next build`
Expected: Clean build with no errors

- [ ] **Step 3: Final commit**

```bash
git status  # review — do NOT stage .env.local or other secrets
git add lib/ hooks/ components/ app/
git commit -m "feat: complete auth, pins, tags & admin feature"
```
