import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Predefined tag categories and labels
export const TAG_CATEGORIES = {
  vibe: {
    label: "Vibe",
    tags: ["Sound spot", "Wouldn't walk through at night", "Dead on", "Up and coming", "Bit rough"],
  },
  food: {
    label: "Food",
    tags: ["Class chippy nearby", "Good Indian", "Nowhere to eat", "Decent coffee spot"],
  },
  landmarks: {
    label: "Landmarks",
    tags: ["Has a Greggs", "Bonfire site", "Nice park", "Good playground", "Near the water"],
  },
  culture: {
    label: "Culture",
    tags: ["Flegs everywhere", "GAA country", "Everyone knows everyone", "Good craic", "Quiet spot"],
  },
  transport: {
    label: "Transport",
    tags: ["Bus? What bus?", "Grand for parking", "Near the motorway", "Walkable"],
  },
} as const;

export type TagCategory = keyof typeof TAG_CATEGORIES | "custom";

export const ALL_TAGS = Object.entries(TAG_CATEGORIES).flatMap(([cat, { tags }]) =>
  tags.map((tag) => ({ category: cat as keyof typeof TAG_CATEGORIES, tag }))
);

// Custom tag validation
export const MAX_TAG_LENGTH = 30;
export const MIN_TAG_LENGTH = 3;

const BLOCKED_WORDS = [
  "fuck", "shit", "cunt", "nigger", "faggot", "retard", "spastic",
  "kill", "bomb", "rape", "nazi", "kys",
];

export function validateCustomTag(tag: string): { valid: boolean; error?: string } {
  const trimmed = tag.trim();

  if (trimmed.length < MIN_TAG_LENGTH) {
    return { valid: false, error: `Tag must be at least ${MIN_TAG_LENGTH} characters` };
  }
  if (trimmed.length > MAX_TAG_LENGTH) {
    return { valid: false, error: `Tag must be at most ${MAX_TAG_LENGTH} characters` };
  }
  if (!/^[a-zA-Z0-9\s'!?-]+$/.test(trimmed)) {
    return { valid: false, error: "Letters, numbers, spaces and basic punctuation only" };
  }

  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { valid: false, error: "Tag contains inappropriate content" };
    }
  }

  // Check if it duplicates a predefined tag
  if (ALL_TAGS.some((t) => t.tag.toLowerCase() === lower)) {
    return { valid: false, error: "This tag already exists — pick it from the list" };
  }

  return { valid: true };
}
