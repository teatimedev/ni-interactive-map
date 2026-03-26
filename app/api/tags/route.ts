import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseServer, ALL_TAGS, validateCustomTag } from "@/lib/supabase";
import { hashIp, getClientIp } from "@/lib/api-utils";
import { getAuthUser, requireConfirmed } from "@/lib/auth";

// GET /api/tags?lgd=belfast&ward=andersonstown
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ tags: [], message: "Supabase not configured" });
  }

  const { searchParams } = request.nextUrl;
  const lgd = searchParams.get("lgd");
  const ward = searchParams.get("ward");

  if (!lgd || !ward) {
    return NextResponse.json({ error: "Missing lgd or ward parameter" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ward_tags")
    .select("id, tag, category, username, user_id")
    .eq("lgd_slug", lgd)
    .eq("ward_slug", ward);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface TagRow { id: number; tag: string; category: string; username: string | null; user_id: string | null; }

  const tagMap = new Map<string, { count: number; category: string; usernames: string[]; ids: number[]; user_ids: string[] }>();
  for (const row of (data as TagRow[]) ?? []) {
    const existing = tagMap.get(row.tag);
    if (existing) {
      existing.count++;
      if (row.username && !existing.usernames.includes(row.username)) existing.usernames.push(row.username);
      existing.ids.push(row.id);
      if (row.user_id) existing.user_ids.push(row.user_id);
    } else {
      tagMap.set(row.tag, {
        count: 1,
        category: row.category,
        usernames: row.username ? [row.username] : [],
        ids: [row.id],
        user_ids: row.user_id ? [row.user_id] : [],
      });
    }
  }

  const tags = [...tagMap.entries()]
    .map(([tag, { count, category, usernames, ids, user_ids }]) => ({ tag, count, category, usernames, ids, user_ids }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ tags });
}

// POST /api/tags
export async function POST(request: NextRequest) {
  if (!supabase || !supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Sign in to add tags" }, { status: 401 });
  }

  const confirmError = requireConfirmed(auth);
  if (confirmError) {
    return NextResponse.json({ error: confirmError }, { status: 403 });
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("username")
    .eq("user_id", auth.userId)
    .single();

  if (!profile?.username) {
    return NextResponse.json({ error: "Set a username first" }, { status: 403 });
  }

  const body = await request.json();
  const { lgd, ward, tag, category } = body;

  if (!lgd || !ward || !tag || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate: predefined or custom
  if (category === "custom") {
    const validation = validateCustomTag(tag);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  } else {
    const isValidTag = ALL_TAGS.some((t) => t.tag === tag && t.category === category);
    if (!isValidTag) {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Rate limit by user (5/hour)
  const { count: userCount } = await supabase
    .from("ward_tags")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .gte("created_at", oneHourAgo);

  if ((userCount ?? 0) >= 5) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  // Secondary IP rate limit
  const { count: ipCount } = await supabase
    .from("ward_tags")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((ipCount ?? 0) >= 8) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  // Check for duplicate (same user, same ward, same tag)
  const { count: dupeCount } = await supabase
    .from("ward_tags")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .eq("lgd_slug", lgd)
    .eq("ward_slug", ward)
    .eq("tag", tag);

  if ((dupeCount ?? 0) > 0) {
    return NextResponse.json({ error: "Already tagged" }, { status: 409 });
  }

  const { error } = await supabase
    .from("ward_tags")
    .insert({
      ward_slug: ward,
      lgd_slug: lgd,
      tag: category === "custom" ? tag.trim() : tag,
      category,
      ip_hash: ipHash,
      user_id: auth.userId,
      username: profile.username,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/tags — report a tag
export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing tag id" }, { status: 400 });
  }

  const { data: tag } = await supabase
    .from("ward_tags")
    .select("report_count")
    .eq("id", id)
    .single();

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const newCount = (tag.report_count ?? 0) + 1;
  const updates: { report_count: number; reported?: boolean } = { report_count: newCount };
  if (newCount >= 3) updates.reported = true;

  const { error } = await supabase
    .from("ward_tags")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/tags — delete a tag (owner or admin)
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
    return NextResponse.json({ error: "Missing tag id" }, { status: 400 });
  }

  if (!auth.isAdmin) {
    const { data: tag } = await supabaseServer
      .from("ward_tags")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!tag || tag.user_id !== auth.userId) {
      return NextResponse.json({ error: "Not authorized to delete this tag" }, { status: 403 });
    }
  }

  const { error } = await supabaseServer
    .from("ward_tags")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
