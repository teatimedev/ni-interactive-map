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
          <p className="auth-guest-note">No email needed — pick a username and go. You won&apos;t be able to recover this account.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
      </div>
    </div>
  );
}
