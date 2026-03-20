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
