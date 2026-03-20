import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

const BLOCKED_WORDS = [
  "fuck", "shit", "cunt", "nigger", "faggot", "retard", "spastic",
  "kill", "bomb", "rape", "nazi", "kys",
];

function validateLabel(label: string): { valid: boolean; error?: string } {
  const trimmed = label.trim();
  if (trimmed.length < 3) return { valid: false, error: "Label must be at least 3 characters" };
  if (trimmed.length > 50) return { valid: false, error: "Label must be at most 50 characters" };
  if (!/^[a-zA-Z0-9\s'!?.,()-]+$/.test(trimmed)) {
    return { valid: false, error: "Letters, numbers, spaces and basic punctuation only" };
  }
  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return { valid: false, error: "Label contains inappropriate content" };
  }
  return { valid: true };
}

// GET /api/pins
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ pins: [] });
  }

  const { data, error } = await supabase
    .from("map_pins")
    .select("id, lat, lng, label, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pins: data ?? [] });
}

// POST /api/pins
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { lat, lng, label } = body;

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

  // Rate limiting: 3 pins per hour per IP
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("map_pins")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Rate limit: 3 pins per hour. Try later." }, { status: 429 });
  }

  const { error } = await supabase
    .from("map_pins")
    .insert({
      lat,
      lng,
      label: label.trim(),
      ip_hash: ipHash,
    });

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
