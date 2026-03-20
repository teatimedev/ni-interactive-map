import { NextRequest, NextResponse } from "next/server";
import { supabase, ALL_TAGS, validateCustomTag } from "@/lib/supabase";
import crypto from "crypto";

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "ni-map-salt").digest("hex").slice(0, 16);
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

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
    .select("tag, category")
    .eq("lgd_slug", lgd)
    .eq("ward_slug", ward);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate counts, preserving actual category from DB
  const tagMap = new Map<string, { count: number; category: string }>();
  for (const row of data ?? []) {
    const existing = tagMap.get(row.tag);
    if (existing) {
      existing.count++;
    } else {
      tagMap.set(row.tag, { count: 1, category: row.category });
    }
  }

  const tags = [...tagMap.entries()]
    .map(([tag, { count, category }]) => ({ tag, count, category }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ tags });
}

// POST /api/tags
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
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

  // Rate limiting: 5 tags per hour per IP
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ward_tags")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  // Check for duplicate (same IP, same ward, same tag)
  const { count: dupeCount } = await supabase
    .from("ward_tags")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
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
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
