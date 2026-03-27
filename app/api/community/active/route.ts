import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET /api/community/active — wards with most recent activity
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ wards: [] });
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "5", 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent pins with ward info
  const { data: recentPins } = await supabaseServer
    .from("map_pins")
    .select("ward_slug, lgd_slug")
    .eq("reported", false)
    .not("ward_slug", "is", null)
    .gte("created_at", sevenDaysAgo)
    .limit(500);

  // Fetch recent tags
  const { data: recentTags } = await supabaseServer
    .from("ward_tags")
    .select("ward_slug, lgd_slug")
    .eq("reported", false)
    .gte("created_at", sevenDaysAgo)
    .limit(500);

  // Aggregate activity by ward
  const activity = new Map<string, { wardSlug: string; lgdSlug: string; pinCount: number; tagCount: number }>();

  for (const pin of recentPins ?? []) {
    if (!pin.ward_slug || !pin.lgd_slug) continue;
    const key = `${pin.lgd_slug}/${pin.ward_slug}`;
    const existing = activity.get(key);
    if (existing) {
      existing.pinCount++;
    } else {
      activity.set(key, { wardSlug: pin.ward_slug, lgdSlug: pin.lgd_slug, pinCount: 1, tagCount: 0 });
    }
  }

  for (const tag of recentTags ?? []) {
    if (!tag.ward_slug || !tag.lgd_slug) continue;
    const key = `${tag.lgd_slug}/${tag.ward_slug}`;
    const existing = activity.get(key);
    if (existing) {
      existing.tagCount++;
    } else {
      activity.set(key, { wardSlug: tag.ward_slug, lgdSlug: tag.lgd_slug, pinCount: 0, tagCount: 1 });
    }
  }

  // Sort by total activity, take top N
  const activeWards = Array.from(activity.values())
    .map((w) => ({ ...w, total: w.pinCount + w.tagCount }))
    .sort((a, b) => b.total - a.total)
    .slice(0, Math.min(limit, 20));

  return NextResponse.json({ wards: activeWards });
}
