"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface PinFeedItemProps {
  pin: {
    id: number;
    lat: number;
    lng: number;
    label: string;
    username: string | null;
    user_id: string | null;
    created_at: string;
    agree_count: number;
    disagree_count: number;
  };
  onFlyTo?: (lat: number, lng: number) => void;
  onRefresh?: () => void;
}

export default function PinFeedItem({ pin, onFlyTo, onRefresh }: PinFeedItemProps) {
  const { user, isAdmin, getToken } = useAuth();
  const [agreeCount, setAgreeCount] = useState(pin.agree_count);
  const [disagreeCount, setDisagreeCount] = useState(pin.disagree_count);
  const [myReaction, setMyReaction] = useState<"agree" | "disagree" | null>(null);
  const [reported, setReported] = useState(false);

  async function handleReact(reaction: "agree" | "disagree") {
    const token = await getToken();
    if (!token) return;

    // Optimistic update
    const wasMyReaction = myReaction;
    if (wasMyReaction === reaction) {
      // Toggle off
      setMyReaction(null);
      if (reaction === "agree") setAgreeCount((c) => c - 1);
      else setDisagreeCount((c) => c - 1);
    } else {
      // Set or switch
      setMyReaction(reaction);
      if (reaction === "agree") {
        setAgreeCount((c) => c + 1);
        if (wasMyReaction === "disagree") setDisagreeCount((c) => c - 1);
      } else {
        setDisagreeCount((c) => c + 1);
        if (wasMyReaction === "agree") setAgreeCount((c) => c - 1);
      }
    }

    try {
      await fetch("/api/pins/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin_id: pin.id, reaction }),
      });
    } catch {
      // Revert on failure
      setMyReaction(wasMyReaction);
      setAgreeCount(pin.agree_count);
      setDisagreeCount(pin.disagree_count);
    }
  }

  async function handleReport() {
    try {
      await fetch("/api/pins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pin.id }),
      });
      setReported(true);
    } catch { /* silently fail */ }
  }

  async function handleDelete() {
    const token = await getToken();
    if (!token) return;
    try {
      await fetch("/api/pins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: pin.id }),
      });
      onRefresh?.();
    } catch { /* silently fail */ }
  }

  const isOwner = user && pin.user_id === user.id;
  const canDelete = isAdmin || isOwner;

  return (
    <div className="pin-feed-item" onClick={() => onFlyTo?.(pin.lat, pin.lng)}>
      <div className="pin-feed-label">{pin.label}</div>
      <div className="pin-feed-meta">
        {pin.username && <span className="pin-feed-user">{pin.username}</span>}
        <span className="pin-feed-time">{timeAgo(pin.created_at)}</span>
      </div>
      <div className="pin-feed-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`pin-feed-react ${myReaction === "agree" ? "active-agree" : ""}`}
          onClick={() => handleReact("agree")}
          title="Agree"
        >
          <span>&#9650;</span> {agreeCount > 0 && <span>{agreeCount}</span>}
        </button>
        <button
          className={`pin-feed-react ${myReaction === "disagree" ? "active-disagree" : ""}`}
          onClick={() => handleReact("disagree")}
          title="Disagree"
        >
          <span>&#9660;</span> {disagreeCount > 0 && <span>{disagreeCount}</span>}
        </button>
        {!isOwner && (
          reported ? (
            <span className="pin-feed-reported">Reported</span>
          ) : (
            <button className="pin-feed-report" onClick={handleReport} title="Report">
              ⚑
            </button>
          )
        )}
        {canDelete && (
          <button className="pin-feed-delete" onClick={handleDelete} title="Delete">
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
