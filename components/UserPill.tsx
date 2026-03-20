"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function UserPill() {
  const { username, isAdmin, signOut } = useAuth();

  if (!username) return null;

  return (
    <div className="user-pill">
      {isAdmin && (
        <Link href="/admin" className="user-pill-admin" title="Admin dashboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15v2"/>
            <path d="M12 8a2 2 0 0 0-2 2v1h4v-1a2 2 0 0 0-2-2z"/>
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </Link>
      )}
      <span className="user-pill-name">{username}</span>
      <button className="user-pill-signout" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
