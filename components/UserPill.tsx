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
