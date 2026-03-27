"use client";

import { useState, useEffect, useCallback } from "react";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/supabase";
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
};

export default function WardTags({ wardSlug, lgdSlug }: WardTagsProps) {
  const { user, isAdmin, getToken } = useAuth();
  const [tags, setTags] = useState<TagCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [available, setAvailable] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [reportedTagIds, setReportedTagIds] = useState<Set<number>>(new Set());
  const [lastAddedTag, setLastAddedTag] = useState<string | null>(null);

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

  async function handleReportTag(id: number) {
    try {
      await fetch("/api/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setReportedTagIds((prev) => new Set(prev).add(id));
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
        setLastAddedTag(tag);
        setTimeout(() => setLastAddedTag(null), 2000);
        setShowPicker(false);
        setOpenCategory(null);
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

  if (!available) return null;

  // Tags the current user has already added to this ward
  const myTags = new Set(
    user ? tags.filter((t) => t.user_ids?.includes(user.id)).map((t) => t.tag) : []
  );

  return (
    <div className="stat-section">
      <h3>Community Tags</h3>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {tags.map((t) => (
            <span
              key={t.tag}
              className={lastAddedTag === t.tag ? "tag-just-added" : ""}
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
              {/* Report button — not shown for own tags or already-reported */}
              {!(user && t.user_ids?.includes(user.id)) && t.ids?.length > 0 && (
                reportedTagIds.has(t.ids[0]) ? (
                  <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 2 }}>
                    Reported
                  </span>
                ) : (
                  <button
                    onClick={() => handleReportTag(t.ids[0])}
                    className="tag-report-btn"
                    title="Report tag"
                  >
                    ⚑
                  </button>
                )
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
            <div key={catKey} style={{ marginBottom: 4 }}>
              <button
                onClick={() => setOpenCategory(openCategory === catKey ? null : catKey)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "6px 4px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  borderBottom: openCategory === catKey ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: CATEGORY_COLORS[catKey], flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11, color: "#ccc", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  {label}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
                  {catTags.length} tags
                </span>
                <span style={{
                  fontSize: 10, color: "var(--text-muted)",
                  transform: openCategory === catKey ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                }}>
                  ▾
                </span>
              </button>
              <div style={{
                maxHeight: openCategory === catKey ? 200 : 0,
                overflow: "hidden",
                transition: "max-height 0.2s ease",
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 4px 8px" }}>
                  {catTags.map((tag) => {
                    const alreadyTagged = myTags.has(tag);
                    return (
                      <button
                        key={tag}
                        disabled={submitting || alreadyTagged}
                        onClick={() => handleAddTag(tag, catKey as TagCategory)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                          background: alreadyTagged ? `${CATEGORY_COLORS[catKey]}15` : "var(--bg-control)",
                          border: `1px solid ${alreadyTagged ? CATEGORY_COLORS[catKey] + "60" : "var(--border-medium)"}`,
                          color: alreadyTagged ? "#666" : "#ccc",
                          cursor: alreadyTagged ? "default" : submitting ? "wait" : "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                          opacity: alreadyTagged ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!alreadyTagged) {
                            (e.target as HTMLButtonElement).style.background = `${CATEGORY_COLORS[catKey]}30`;
                            (e.target as HTMLButtonElement).style.borderColor = CATEGORY_COLORS[catKey];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!alreadyTagged) {
                            (e.target as HTMLButtonElement).style.background = "var(--bg-control)";
                            (e.target as HTMLButtonElement).style.borderColor = "var(--border-medium)";
                          }
                        }}
                      >
                        {alreadyTagged ? "✓ " : ""}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <button
            className="btn-map"
            style={{ fontSize: 11, padding: "4px 8px", marginTop: 8 }}
            onClick={() => { setShowPicker(false); setOpenCategory(null); }}
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
