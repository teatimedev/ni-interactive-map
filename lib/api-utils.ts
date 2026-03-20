import crypto from "crypto";
import { NextRequest } from "next/server";

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "ni-map-salt").digest("hex").slice(0, 16);
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const BLOCKED_WORDS = [
  "fuck", "shit", "cunt", "nigger", "faggot", "retard", "spastic",
  "kill", "bomb", "rape", "nazi", "kys",
];

export function validateLabel(label: string): { valid: boolean; error?: string } {
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
