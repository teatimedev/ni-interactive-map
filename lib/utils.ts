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
