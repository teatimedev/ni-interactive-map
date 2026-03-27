import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET /api/pins/recent — recent pins across all of NI
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ pins: [] });
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);

  const { data, error } = await supabaseServer
    .from("map_pins")
    .select("id, lat, lng, label, username, user_id, ward_slug, lgd_slug, created_at")
    .eq("reported", false)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 50));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Batch fetch reaction counts
  const pins = data ?? [];
  let reactions: Record<number, { agree: number; disagree: number }> = {};
  if (pins.length > 0) {
    const pinIds = pins.map((p) => p.id);
    const { data: reactionData } = await supabaseServer
      .from("pin_reactions")
      .select("pin_id, reaction")
      .in("pin_id", pinIds);

    if (reactionData) {
      for (const r of reactionData) {
        if (!reactions[r.pin_id]) reactions[r.pin_id] = { agree: 0, disagree: 0 };
        if (r.reaction === "agree") reactions[r.pin_id].agree++;
        else reactions[r.pin_id].disagree++;
      }
    }
  }

  const pinsWithReactions = pins.map((p) => ({
    ...p,
    agree_count: reactions[p.id]?.agree ?? 0,
    disagree_count: reactions[p.id]?.disagree ?? 0,
  }));

  return NextResponse.json({ pins: pinsWithReactions });
}
