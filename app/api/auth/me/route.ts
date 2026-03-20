import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ user: null });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ user: null });
  }

  // Fetch username from profiles
  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("username")
    .eq("user_id", auth.userId)
    .single();

  return NextResponse.json({
    user: { id: auth.userId, email: auth.email },
    username: profile?.username ?? null,
    isAdmin: auth.isAdmin,
  });
}
