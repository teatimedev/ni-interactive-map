"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils";
import PinFeedItem from "@/components/ui/PinFeedItem";

interface RecentPin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  username: string | null;
  user_id: string | null;
  ward_slug: string | null;
  lgd_slug: string | null;
  created_at: string;
  agree_count: number;
  disagree_count: number;
}

interface TrendingTag {
  tag: string;
  category: string;
  count: number;
}

interface ActiveWard {
  wardSlug: string;
  lgdSlug: string;
  pinCount: number;
  tagCount: number;
  total: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  vibe: "#9b6dbd",
  food: "#e5a030",
  landmarks: "#34a853",
  culture: "#3b82c4",
  transport: "#d4453a",
  custom: "#16a085",
};

interface CommunityOverviewProps {
  onFlyToPin?: (lat: number, lng: number) => void;
  onActivatePinMode?: () => void;
  onSelectWard?: (lgdSlug: string, wardSlug: string) => void;
}

export default function CommunityOverview({ onFlyToPin, onActivatePinMode, onSelectWard }: CommunityOverviewProps) {
  const [pins, setPins] = useState<RecentPin[]>([]);
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [activeWards, setActiveWards] = useState<ActiveWard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [pinsRes, tagsRes, wardsRes] = await Promise.all([
        fetch("/api/pins/recent?limit=20").then((r) => r.json()).catch(() => ({ pins: [] })),
        fetch("/api/tags/trending?limit=15").then((r) => r.json()).catch(() => ({ tags: [] })),
        fetch("/api/community/active?limit=5").then((r) => r.json()).catch(() => ({ wards: [] })),
      ]);
      setPins(pinsRes.pins ?? []);
      setTags(tagsRes.tags ?? []);
      setActiveWards(wardsRes.wards ?? []);
      setLoading(false);
    }
    fetchAll();
  }, []);

  function slugToName(slug: string): string {
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (loading) {
    return (
      <div style={{ padding: "var(--space-6)", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        Loading community...
      </div>
    );
  }

  return (
    <div className="community-overview">
      {/* Header */}
      <div className="community-overview-header">
        <h2>What&apos;s Happening</h2>
        <p>Recent activity across Northern Ireland</p>
      </div>

      {/* Active Wards */}
      {activeWards.length > 0 && (
        <div className="community-section">
          <h3>Active Wards</h3>
          <div className="active-wards-list">
            {activeWards.map((w) => (
              <button
                key={`${w.lgdSlug}/${w.wardSlug}`}
                className="active-ward-item"
                onClick={() => onSelectWard?.(w.lgdSlug, w.wardSlug)}
              >
                <div className="active-ward-name">{slugToName(w.wardSlug)}</div>
                <div className="active-ward-district">{slugToName(w.lgdSlug)}</div>
                <div className="active-ward-stats">
                  {w.pinCount > 0 && <span>{w.pinCount} pin{w.pinCount !== 1 ? "s" : ""}</span>}
                  {w.tagCount > 0 && <span>{w.tagCount} tag{w.tagCount !== 1 ? "s" : ""}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Tags */}
      {tags.length > 0 && (
        <div className="community-section">
          <h3>Trending Tags</h3>
          <div className="trending-tags">
            {tags.map((t) => (
              <span
                key={t.tag}
                className="trending-tag"
                style={{
                  background: `${CATEGORY_COLORS[t.category] ?? "#555"}18`,
                  borderColor: `${CATEGORY_COLORS[t.category] ?? "#555"}40`,
                }}
              >
                {t.tag}
                <span className="trending-tag-count">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Pins Feed */}
      <div className="community-section">
        <h3>Recent Pins</h3>
        {pins.length === 0 ? (
          <div className="community-empty">
            <p>No pins dropped yet. Be the first!</p>
          </div>
        ) : (
          <div className="pin-feed">
            {pins.map((pin) => (
              <div key={pin.id} className="pin-feed-item-with-location">
                {pin.ward_slug && (
                  <div className="pin-feed-location">
                    {slugToName(pin.ward_slug)}, {slugToName(pin.lgd_slug ?? "")}
                  </div>
                )}
                <PinFeedItem
                  pin={pin}
                  onFlyTo={onFlyToPin}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop a Pin CTA */}
      {onActivatePinMode && (
        <div className="community-overview-cta">
          <button className="btn-map" onClick={onActivatePinMode}>
            Drop a pin
          </button>
          <span className="community-cta-hint">Share what you think about a place</span>
        </div>
      )}
    </div>
  );
}
