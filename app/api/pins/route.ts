import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseServer } from "@/lib/supabase";
import { hashIp, getClientIp, validateLabel } from "@/lib/api-utils";
import { getAuthUser, requireConfirmed } from "@/lib/auth";

// GET /api/pins — all pins (map view) or ward-filtered (community tab)
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ pins: [] });
  }

  const { searchParams } = request.nextUrl;
  const lgd = searchParams.get("lgd");
  const ward = searchParams.get("ward");

  // Ward-filtered query (for Community tab)
  if (lgd && ward) {
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const { data, error } = await supabase
      .from("map_pins")
      .select("id, lat, lng, label, username, user_id, created_at, ward_slug, lgd_slug")
      .eq("lgd_slug", lgd)
      .eq("ward_slug", ward)
      .eq("reported", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pins = data ?? [];

    // Batch fetch reaction counts
    let reactions: Record<number, { agree: number; disagree: number }> = {};
    if (pins.length > 0) {
      const pinIds = pins.map((p: { id: number }) => p.id);
      const { data: reactionData } = await supabase
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

    const pinsWithReactions = pins.map((p: { id: number }) => ({
      ...p,
      agree_count: reactions[p.id]?.agree ?? 0,
      disagree_count: reactions[p.id]?.disagree ?? 0,
    }));

    return NextResponse.json({ pins: pinsWithReactions, hasMore: pins.length === limit });
  }

  // Default: all pins for map view
  const { data, error } = await supabase
    .from("map_pins")
    .select("id, lat, lng, label, username, user_id, created_at")
    .eq("reported", false)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pins: data ?? [] });
}

// POST /api/pins
export async function POST(request: NextRequest) {
  if (!supabase || !supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Sign in to drop pins" }, { status: 401 });
  }

  // Block unconfirmed email+password users
  const confirmError = requireConfirmed(auth);
  if (confirmError) {
    return NextResponse.json({ error: confirmError }, { status: 403 });
  }

  // Fetch username from profiles
  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("username")
    .eq("user_id", auth.userId)
    .single();

  if (!profile?.username) {
    return NextResponse.json({ error: "Set a username first" }, { status: 403 });
  }

  const body = await request.json();
  const { lat, lng, label, wardSlug, lgdSlug } = body;

  if (lat == null || lng == null || !label) {
    return NextResponse.json({ error: "Missing lat, lng, or label" }, { status: 400 });
  }

  // Validate coordinates are within NI
  if (lat < 53.9 || lat > 55.4 || lng < -8.2 || lng > -5.4) {
    return NextResponse.json({ error: "Coordinates outside Northern Ireland" }, { status: 400 });
  }

  const validation = validateLabel(label);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Rate limit by user (3/hour)
  const { count: userCount } = await supabase
    .from("map_pins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .gte("created_at", oneHourAgo);

  if ((userCount ?? 0) >= 3) {
    return NextResponse.json({ error: "Rate limit: 3 pins per hour. Try later." }, { status: 429 });
  }

  // Secondary IP rate limit (prevents guest account spam)
  const { count: ipCount } = await supabase
    .from("map_pins")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((ipCount ?? 0) >= 5) {
    return NextResponse.json({ error: "Rate limit exceeded. Try later." }, { status: 429 });
  }

  const { error } = await supabase
    .from("map_pins")
    .insert({
      lat,
      lng,
      label: label.trim(),
      ip_hash: ipHash,
      user_id: auth.userId,
      username: profile.username,
      ...(wardSlug ? { ward_slug: wardSlug } : {}),
      ...(lgdSlug ? { lgd_slug: lgdSlug } : {}),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/pins — delete a pin (owner or admin)
export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing pin id" }, { status: 400 });
  }

  // Check ownership or admin
  if (!auth.isAdmin) {
    const { data: pin } = await supabaseServer
      .from("map_pins")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!pin || pin.user_id !== auth.userId) {
      return NextResponse.json({ error: "Not authorized to delete this pin" }, { status: 403 });
    }
  }

  const { error } = await supabaseServer
    .from("map_pins")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/pins — report a pin
export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing pin id" }, { status: 400 });
  }

  // Get current report count, then increment
  const { data: pin } = await supabase
    .from("map_pins")
    .select("report_count")
    .eq("id", id)
    .single();

  const newCount = (pin?.report_count ?? 0) + 1;

  const { error } = await supabase
    .from("map_pins")
    .update({ report_count: newCount, reported: newCount >= 3 })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
