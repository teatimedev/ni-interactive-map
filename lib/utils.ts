export function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return typeof n === "number" ? n.toLocaleString() : String(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(1) + "%";
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return "£" + n.toLocaleString();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function deslugify(
  slug: string,
  items: { name: string; slug: string }[]
): string | null {
  const found = items.find((item) => item.slug === slug);
  return found ? found.name : null;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
