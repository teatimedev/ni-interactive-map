"use client";

import { useState, useEffect, useCallback } from "react";
import SectionWrapper from "@/components/ui/SectionWrapper";
import WardTags from "@/components/ui/WardTags";
import PinFeedItem from "@/components/ui/PinFeedItem";

interface CommunityPin {
  id: number;
  lat: number;
  lng: number;
  label: string;
  username: string | null;
  user_id: string | null;
  created_at: string;
  agree_count: number;
  disagree_count: number;
}

interface CommunityTabProps {
  wardSlug: string;
  lgdSlug: string;
  onActivatePinMode?: () => void;
  onFlyToPin?: (lat: number, lng: number) => void;
}

export default function CommunityTab({ wardSlug, lgdSlug, onActivatePinMode, onFlyToPin }: CommunityTabProps) {
  const [pins, setPins] = useState<CommunityPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchPins = useCallback(async (reset = false) => {
    const o = reset ? 0 : offset;
    try {
      const res = await fetch(`/api/pins?lgd=${lgdSlug}&ward=${wardSlug}&offset=${o}&limit=20`);
      const data = await res.json();
      const newPins = data.pins ?? [];
      if (reset) {
        setPins(newPins);
        setOffset(newPins.length);
      } else {
        setPins((prev) => [...prev, ...newPins]);
        setOffset((prev) => prev + newPins.length);
      }
      setHasMore(data.hasMore ?? false);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [lgdSlug, wardSlug, offset]);

  useEffect(() => {
    setLoading(true);
    setPins([]);
    setOffset(0);
    fetchPins(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lgdSlug, wardSlug]);

  return (
    <>
      <SectionWrapper title="What People Are Saying">
        {/* Ward pulse */}
        {!loading && (
          <div className="community-pulse">
            {pins.length} pin{pins.length !== 1 ? "s" : ""} dropped in this ward
          </div>
        )}

        {/* Pin feed */}
        {loading && (
          <div className="community-loading">Loading community...</div>
        )}

        {!loading && pins.length === 0 && (
          <div className="community-empty">
            <p>No pins in this ward yet.</p>
            <p>Be the first to share what you think about this area!</p>
            {onActivatePinMode && (
              <button className="btn-map community-drop-cta" onClick={onActivatePinMode}>
                Drop a pin
              </button>
            )}
          </div>
        )}

        {pins.length > 0 && (
          <div className="pin-feed">
            {pins.map((pin) => (
              <PinFeedItem
                key={pin.id}
                pin={pin}
                onFlyTo={onFlyToPin}
                onRefresh={() => fetchPins(true)}
              />
            ))}
            {hasMore && (
              <button
                className="btn-map community-load-more"
                onClick={() => fetchPins(false)}
              >
                Load more
              </button>
            )}
          </div>
        )}

        {!loading && pins.length > 0 && onActivatePinMode && (
          <div className="community-cta">
            <button className="btn-map" onClick={onActivatePinMode}>
              Drop a pin
            </button>
            <span className="community-cta-hint">Share a thought about this area</span>
          </div>
        )}
      </SectionWrapper>

      <SectionWrapper title="Community Tags">
        <WardTags wardSlug={wardSlug} lgdSlug={lgdSlug} />
      </SectionWrapper>
    </>
  );
}
