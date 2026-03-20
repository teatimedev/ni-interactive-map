import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const reported = searchParams.get("reported") === "true";
  const search = searchParams.get("search") ?? "";

  let query = supabaseServer
    .from("map_pins")
    .select("id, lat, lng, label, username, user_id, report_count, reported, created_at")
    .order("report_count", { ascending: false })
    .limit(500);

  if (reported) query = query.eq("reported", true);
  if (search) query = query.ilike("username", `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pins: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("map_pins")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: ids.length });
}
