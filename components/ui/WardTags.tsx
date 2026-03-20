"use client";

import { useState, useEffect, useCallback } from "react";
import { TAG_CATEGORIES, type TagCategory, MAX_TAG_LENGTH, MIN_TAG_LENGTH, validateCustomTag } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface TagCount {
  tag: string;
  count: number;
  category: string;
  usernames: string[];
  ids: number[];
  user_ids: string[];
}

interface WardTagsProps {
  wardSlug: string;
  lgdSlug: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  vibe: "#8e44ad",
  food: "#e8a838",
  landmarks: "#27ae60",
  culture: "#2980b9",
  transport: "#c0392b",
  custom: "#95a5a6",
};

export default function WardTags({ wardSlug, lgdSlug }: WardTagsProps) {
  const { user, isAdmin, getToken } = useAuth();
  const [tags, setTags] = useState<TagCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [available, setAvailable] = useState(true);
  const [customTag, setCustomTag] = useState("");

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`/api/tags?lgd=${lgdSlug}&ward=${wardSlug}`);
      const data = await res.json();
      if (data.message === "Supabase not configured") {
        setAvailable(false);
        return;
      }
      setTags(data.tags ?? []);
    } catch {
      setAvailable(false);
    }
  }, [lgdSlug, wardSlug]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

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

  function handleSubmitCustom() {
    const validation = validateCustomTag(customTag);
    if (!validation.valid) {
      setMessage(validation.error ?? "Invalid tag");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    handleAddTag(customTag.trim(), "custom" as TagCategory);
  }

  if (!available) return null;

  return (
    <div className="stat-section">
      <h3>Community Tags</h3>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {tags.map((t) => (
            <span
              key={t.tag}
              title={t.usernames?.length > 0 ? `by ${t.usernames.join(", ")}` : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 11,
                background: `${CATEGORY_COLORS[t.category] ?? "#555"}20`,
                border: `1px solid ${CATEGORY_COLORS[t.category] ?? "#555"}40`,
                color: "#ccc",
              }}
            >
              {t.tag}
              <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>
                {t.count}
              </span>
              {(isAdmin || (user && t.user_ids?.includes(user.id))) && t.ids?.length > 0 && (
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
        </div>
      )}

      {tags.length === 0 && !showPicker && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
          No tags yet — be the first!
        </p>
      )}

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

      {showPicker && (
        <div style={{
          background: "var(--card-gradient), var(--bg-card)",
          border: "1px solid var(--card-border)",
          borderRadius: 10,
          padding: 12,
          marginTop: 8,
        }}>
          {Object.entries(TAG_CATEGORIES).map(([catKey, { label, tags: catTags }]) => (
            <div key={catKey} style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 10,
                color: CATEGORY_COLORS[catKey],
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
                fontWeight: 600,
              }}>
                {label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {catTags.map((tag) => (
                  <button
                    key={tag}
                    disabled={submitting}
                    onClick={() => handleAddTag(tag, catKey as TagCategory)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 10,
                      fontSize: 11,
                      background: "var(--bg-control)",
                      border: "1px solid var(--border-medium)",
                      color: "#ccc",
                      cursor: submitting ? "wait" : "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = `${CATEGORY_COLORS[catKey]}30`;
                      (e.target as HTMLButtonElement).style.borderColor = CATEGORY_COLORS[catKey];
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = "var(--bg-control)";
                      (e.target as HTMLButtonElement).style.borderColor = "var(--border-medium)";
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Custom tag input */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
              fontSize: 10,
              color: CATEGORY_COLORS.custom,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
              fontWeight: 600,
            }}>
              Your own tag
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value.slice(0, MAX_TAG_LENGTH))}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmitCustom(); }}
                placeholder="Type your own tag..."
                disabled={submitting}
                style={{
                  flex: 1,
                  background: "var(--bg-control)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                className="btn-map"
                style={{ fontSize: 11, padding: "5px 10px" }}
                disabled={submitting || customTag.trim().length < MIN_TAG_LENGTH}
                onClick={handleSubmitCustom}
              >
                Add
              </button>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
              {customTag.length}/{MAX_TAG_LENGTH}
            </div>
          </div>

          <button
            className="btn-map"
            style={{ fontSize: 11, padding: "4px 8px", marginTop: 8 }}
            onClick={() => { setShowPicker(false); setCustomTag(""); }}
          >
            Cancel
          </button>
        </div>
      )}

      {message && (
        <div style={{
          fontSize: 11,
          color: message === "Tagged!" ? "var(--positive)" : "var(--warning)",
          marginTop: 6,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
