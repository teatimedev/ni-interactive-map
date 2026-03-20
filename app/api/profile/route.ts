import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { BLOCKED_WORDS } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username } = body;

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const trimmed = username.trim();

  // Validate format: 3-20 chars, alphanumeric + underscores
  if (trimmed.length < 3 || trimmed.length > 20) {
    return NextResponse.json({ error: "Username must be 3-20 characters" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return NextResponse.json({ error: "Letters, numbers and underscores only" }, { status: 400 });
  }

  // Check blocked words
  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return NextResponse.json({ error: "Username contains inappropriate content" }, { status: 400 });
    }
  }

  // Check if user already has a username (immutable once set)
  const { data: existingProfile } = await supabaseServer
    .from("profiles")
    .select("username")
    .eq("user_id", auth.userId)
    .single();

  if (existingProfile) {
    return NextResponse.json({ error: "Username already set and cannot be changed" }, { status: 409 });
  }

  // Check username uniqueness
  const { data: taken } = await supabaseServer
    .from("profiles")
    .select("user_id")
    .eq("username", trimmed)
    .single();

  if (taken) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  // Insert profile (not upsert — usernames are immutable)
  const { error } = await supabaseServer
    .from("profiles")
    .insert({ user_id: auth.userId, username: trimmed });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ username: trimmed });
}
