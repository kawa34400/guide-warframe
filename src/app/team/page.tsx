"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import construction from "@/data/construction.json";
import incarnonData from "@/data/incarnon.json";

type Profile = { user_id: string; display_name: string };
type ProgressRow = {
  user_id: string;
  namespace: string;
  item_id: string;
  done: boolean;
};

type Pair = {
  resource: { name: string; source: string | null } | null;
  built: { name: string; source: string | null } | null;
};

// Build the canonical item lists per namespace, in the same id format the
// page-level checklists use.
function buildCatalog() {
  const items: Record<string, { id: string; label: string }[]> = {
    construction: [],
    incarnon: [],
    warframes: [],
  };

  // construction (matches src/app/construction/page.tsx id format)
  for (const [section, pairs] of Object.entries(construction as Record<string, Pair[]>)) {
    pairs.forEach((p, i) => {
      if (p.resource)
        items.construction.push({
          id: `${section}:res:${p.resource.name}:${i}`,
          label: `[${section}] ${p.resource.name}`,
        });
      if (p.built)
        items.construction.push({
          id: `${section}:built:${p.built.name}:${i}`,
          label: `[${section}] ${p.built.name} (craft)`,
        });
    });
  }

  // incarnon: rotation items (rot:W:name), evolutions (evo:name), zariman (zariman:name)
  const inc = incarnonData as {
    evolutions: string[];
    evolutionsZariman: string[];
    incarnonRotation: Record<string, string[]>;
  };
  for (const [w, list] of Object.entries(inc.incarnonRotation))
    for (const n of list)
      items.incarnon.push({ id: `rot:${w}:${n}`, label: `S${w} — ${n}` });
  for (const n of inc.evolutions)
    items.incarnon.push({ id: `evo:${n}`, label: `Évo — ${n}` });
  for (const n of inc.evolutionsZariman)
    items.incarnon.push({ id: `zariman:${n}`, label: `Zariman — ${n}` });

  // warframes
  for (const [w, list] of Object.entries(
    (incarnonData as any).warframeRotation as Record<string, string[]>,
  ))
    for (const n of list)
      items.warframes.push({ id: `wf:${n}`, label: `S${w} — ${n}` });

  return items;
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState<
    "construction" | "incarnon" | "warframes"
  >("incarnon");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pRes, rRes] = await Promise.all([
        sb.from("profiles").select("user_id, display_name"),
        sb.from("progress").select("user_id, namespace, item_id, done"),
      ]);
      if (!cancelled) {
        if (pRes.data) setProfiles(pRes.data);
        if (rRes.data) setRows(rRes.data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const catalog = useMemo(buildCatalog, []);

  // Map: user_id -> namespace -> Set<item_id>
  const doneIndex = useMemo(() => {
    const m = new Map<string, Map<string, Set<string>>>();
    for (const r of rows) {
      if (!r.done) continue;
      if (!m.has(r.user_id)) m.set(r.user_id, new Map());
      const ns = m.get(r.user_id)!;
      if (!ns.has(r.namespace)) ns.set(r.namespace, new Set());
      ns.get(r.namespace)!.add(r.item_id);
    }
    return m;
  }, [rows]);

  if (authLoading || (user && loading))
    return <div className="text-muted">Chargement...</div>;

  if (!user) {
    return (
      <div className="bg-panel border border-border rounded-lg p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Vue Équipe</h1>
        <p className="text-muted">
          Connecte-toi (en haut à droite) pour voir la progression de ton équipe.
        </p>
      </div>
    );
  }

  const items = catalog[namespace].filter((it) =>
    !filter ? true : it.label.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Vue Équipe</h1>
        <p className="text-muted text-sm">
          {profiles.length} membre{profiles.length > 1 ? "s" : ""} · qui a quoi
        </p>
      </header>

      {/* Per-user totals */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((p) => {
          const userMap = doneIndex.get(p.user_id);
          const stats = (["construction", "incarnon", "warframes"] as const).map(
            (ns) => {
              const total = catalog[ns].length;
              const done = userMap?.get(ns)?.size ?? 0;
              return { ns, done, total };
            },
          );
          return (
            <div
              key={p.user_id}
              className="bg-panel border border-border rounded-lg p-3"
            >
              <div className="font-semibold mb-2">
                {p.display_name}
                {p.user_id === user.id && (
                  <span className="ml-2 text-xs text-accent">(toi)</span>
                )}
              </div>
              <div className="space-y-1 text-xs">
                {stats.map((s) => {
                  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
                  return (
                    <div key={s.ns} className="flex items-center gap-2">
                      <span className="w-24 capitalize text-muted">{s.ns}</span>
                      <div className="flex-1 h-2 bg-panel-2 rounded overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-muted tabular-nums w-16 text-right">
                        {s.done}/{s.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Item × user grid */}
      <section className="bg-panel border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex gap-1">
            {(["construction", "incarnon", "warframes"] as const).map((ns) => (
              <button
                key={ns}
                onClick={() => setNamespace(ns)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  namespace === ns
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:bg-panel-2"
                }`}
              >
                {ns}
              </button>
            ))}
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer..."
            className="ml-auto bg-panel-2 border border-border rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs">
              <tr>
                <th className="text-left p-1 sticky left-0 bg-panel">Item</th>
                {profiles.map((p) => (
                  <th
                    key={p.user_id}
                    className="text-center p-1 font-normal min-w-[60px]"
                  >
                    {p.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border/50">
                  <td className="p-1 sticky left-0 bg-panel whitespace-nowrap pr-4">
                    {it.label}
                  </td>
                  {profiles.map((p) => {
                    const done = doneIndex.get(p.user_id)?.get(namespace)?.has(it.id);
                    return (
                      <td key={p.user_id} className="text-center p-1">
                        {done ? (
                          <span className="text-done">✓</span>
                        ) : (
                          <span className="text-muted/30">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
