import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export interface AuthResult {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  isAnonymous: boolean;
  emailConfirmed: boolean;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function getAuthUser(request: NextRequest): Promise<AuthResult | null> {
  if (!supabaseServer) return null;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) return null;

  const email = user.email ?? null;
  const isAdmin = email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false;
  const isAnonymous = user.is_anonymous ?? false;
  const emailConfirmed = isAnonymous || !!user.email_confirmed_at;

  return { userId: user.id, email, isAdmin, isAnonymous, emailConfirmed };
}

/**
 * Helper to enforce that email+password users have confirmed their email.
 * Guest/anonymous users skip this check.
 */
export function requireConfirmed(auth: AuthResult): string | null {
  if (!auth.emailConfirmed) {
    return "Please confirm your email before creating content";
  }
  return null;
}
