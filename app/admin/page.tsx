"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "pins" | "tags";

interface PinRow {
  id: number; lat: number; lng: number; label: string;
  username: string | null; user_id: string | null;
  report_count: number; reported: boolean; created_at: string;
}

interface TagRow {
  id: number; tag: string; category: string; ward_slug: string; lgd_slug: string;
  username: string | null; user_id: string | null;
  report_count: number; reported: boolean; created_at: string;
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Tab>("pins");
  const [pins, setPins] = useState<PinRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [filter, setFilter] = useState<"all" | "reported">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { setLoading(false); return; }

    const endpoint = tab === "pins" ? "/api/admin/pins" : "/api/admin/tags";
    const params = new URLSearchParams();
    if (filter === "reported") params.set("reported", "true");
    if (search) params.set("search", search);

    try {
      const res = await fetch(`${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (tab === "pins") setPins(data.pins ?? []);
      else setTags(data.tags ?? []);
    } catch {
      // silently fail
    }
    setSelected(new Set());
    setLoading(false);
  }, [tab, filter, search, getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleBulkDelete() {
    const token = await getToken();
    if (!token || selected.size === 0) return;

    const endpoint = tab === "pins" ? "/api/admin/pins" : "/api/admin/tags";
    await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: [...selected] }),
    });
    fetchData();
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const ids = tab === "pins" ? pins.map((p) => p.id) : tags.map((t) => t.id);
    if (selected.size === ids.length) setSelected(new Set());
    else setSelected(new Set(ids));
  }

  const rows = tab === "pins" ? pins : tags;

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", color: "#ccc", padding: 24, fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, color: "#fff", margin: 0 }}>Admin Dashboard</h1>
          <a href="/" style={{ color: "#4ecdc4", fontSize: 13, textDecoration: "none" }}>&larr; Back to map</a>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #333" }}>
          {(["pins", "tags"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", background: "none", border: "none", cursor: "pointer",
              color: tab === t ? "#fff" : "#888", borderBottom: tab === t ? "2px solid #4ecdc4" : "2px solid transparent",
              fontSize: 13, fontFamily: "inherit", textTransform: "capitalize",
            }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "reported")} style={{
            background: "#2a2a2a", border: "1px solid #444", borderRadius: 6, padding: "6px 10px", color: "#ccc", fontSize: 12,
          }}>
            <option value="all">All</option>
            <option value="reported">Reported only</option>
          </select>
          <input
            type="text" placeholder="Search by username..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "#2a2a2a", border: "1px solid #444", borderRadius: 6, padding: "6px 10px", color: "#ccc", fontSize: 12, width: 200 }}
          />
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} style={{
              background: "#c0392b", color: "#fff", border: "none", borderRadius: 6,
              padding: "6px 14px", fontSize: 12, cursor: "pointer",
            }}>
              Delete {selected.size} selected
            </button>
          )}
          {loading && <span style={{ fontSize: 12, color: "#888" }}>Loading...</span>}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: 8, width: 30 }}>
                <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: 8 }}>{tab === "pins" ? "Label" : "Tag"}</th>
              <th style={{ padding: 8 }}>Username</th>
              <th style={{ padding: 8 }}>Reports</th>
              <th style={{ padding: 8 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {tab === "pins"
              ? pins.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #2a2a2a", background: p.reported ? "rgba(192,57,43,0.1)" : "transparent" }}>
                  <td style={{ padding: 8 }}><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td style={{ padding: 8 }}>{p.label}</td>
                  <td style={{ padding: 8, color: "#888" }}>{p.username ?? "anonymous"}</td>
                  <td style={{ padding: 8, color: p.report_count > 0 ? "#c0392b" : "#555" }}>{p.report_count}</td>
                  <td style={{ padding: 8, color: "#666" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))
              : tags.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #2a2a2a", background: t.reported ? "rgba(192,57,43,0.1)" : "transparent" }}>
                  <td style={{ padding: 8 }}><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} /></td>
                  <td style={{ padding: 8 }}>{t.tag} <span style={{ color: "#666", fontSize: 10 }}>({t.lgd_slug}/{t.ward_slug})</span></td>
                  <td style={{ padding: 8, color: "#888" }}>{t.username ?? "anonymous"}</td>
                  <td style={{ padding: 8, color: t.report_count > 0 ? "#c0392b" : "#555" }}>{t.report_count}</td>
                  <td style={{ padding: 8, color: "#666" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {rows.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>No {tab} found</div>
        )}
      </div>
    </div>
  );
}
