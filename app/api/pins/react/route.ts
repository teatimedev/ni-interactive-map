import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// POST /api/pins/react — toggle agree/disagree reaction on a pin
export async function POST(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Sign in to react" }, { status: 401 });
  }

  const body = await request.json();
  const { pin_id, reaction } = body;

  if (!pin_id || !reaction || !["agree", "disagree"].includes(reaction)) {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
  }

  // Check for existing reaction
  const { data: existing } = await supabaseServer
    .from("pin_reactions")
    .select("id, reaction")
    .eq("pin_id", pin_id)
    .eq("user_id", auth.userId)
    .single();

  if (existing) {
    if (existing.reaction === reaction) {
      // Same reaction — toggle off (delete)
      await supabaseServer.from("pin_reactions").delete().eq("id", existing.id);
      return NextResponse.json({ action: "removed" });
    } else {
      // Different reaction — switch
      await supabaseServer
        .from("pin_reactions")
        .update({ reaction })
        .eq("id", existing.id);
      return NextResponse.json({ action: "switched", reaction });
    }
  }

  // No existing reaction — insert
  const { error } = await supabaseServer.from("pin_reactions").insert({
    pin_id,
    user_id: auth.userId,
    reaction,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: "added", reaction });
}
