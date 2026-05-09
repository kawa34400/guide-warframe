"use client";
import { useMemo, useState } from "react";
import {
  useLichWeapons,
  useLichMeta,
  ELEMENT_COLORS,
  LICH_TYPES,
  type LichWeapon,
  type Element,
} from "@/lib/lich";
import { useChecklist } from "@/lib/storage";
import LichEditModal from "@/components/LichEditModal";

const TYPE_COLOR: Record<string, string> = {
  Kuva: "border-faction-grineer/40 text-faction-grineer",
  Tenet: "border-faction-corpus/40 text-faction-corpus",
  Coda: "border-faction-infested/40 text-faction-infested",
  Hound: "border-tier-omnia/40 text-tier-omnia",
};

export default function LichPage() {
  const { items, loading, error } = useLichWeapons();
  const checklist = useChecklist("lich");
  const meta = useLichMeta();

  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "Kuva" | "Tenet" | "Coda" | "Hound"
  >("all");
  const [hideOwned, setHideOwned] = useState(false);
  const [editing, setEditing] = useState<LichWeapon | null>(null);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim();
    return items.filter((it) => {
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (f && !it.name.toLowerCase().includes(f)) return false;
      if (hideOwned && checklist.state[it.uniqueName]) return false;
      return true;
    });
  }, [items, filter, typeFilter, hideOwned, checklist.state]);

  const grouped = useMemo(() => {
    const m: Record<string, LichWeapon[]> = {};
    for (const it of filtered) (m[it.type] ||= []).push(it);
    return m;
  }, [filtered]);

  const stats = useMemo(() => {
    const s: Record<string, { done: number; total: number }> = {
      Kuva: { done: 0, total: 0 },
      Tenet: { done: 0, total: 0 },
      Coda: { done: 0, total: 0 },
      Hound: { done: 0, total: 0 },
    };
    for (const it of items) {
      s[it.type].total++;
      if (checklist.state[it.uniqueName]) s[it.type].done++;
    }
    return s;
  }, [items, checklist.state]);

  const totalDone = Object.values(stats).reduce((a, c) => a + c.done, 0);
  const totalAll = Object.values(stats).reduce((a, c) => a + c.total, 0);

  if (error)
    return (
      <div className="text-danger">Erreur de chargement: {error}</div>
    );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Lich · Sister · Coda</h1>
        <p className="text-muted text-sm">
          {loading
            ? "Chargement..."
            : `${totalAll} entrées : ${stats.Kuva.total} Kuva · ${stats.Tenet.total} Tenet · ${stats.Coda.total} Coda · ${stats.Hound.total} Hounds`}
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`panel notch p-3 text-left ${
            typeFilter === "all" ? "border-accent/60" : ""
          }`}
        >
          <div className="text-xs text-muted uppercase tracking-wider">Tout</div>
          <div className="font-display text-xl">
            {totalDone}
            <span className="text-sm text-muted">/{totalAll}</span>
          </div>
        </button>
        {LICH_TYPES.map(({ type, label, sub }) => {
          const s = stats[type];
          const active = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? "all" : type)}
              className={`panel notch p-3 text-left ${
                active ? "border-accent/60" : ""
              }`}
            >
              <div
                className={`text-xs uppercase tracking-wider ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {label}
              </div>
              <div className="text-[10px] text-muted/70 mb-1">{sub}</div>
              <div className="font-display text-xl">
                {s.done}
                <span className="text-sm text-muted">/{s.total}</span>
              </div>
              <div className="h-1 bg-panel-2 rounded mt-1 overflow-hidden">
                <div
                  className="h-full bg-accent/70"
                  style={{
                    width: s.total ? `${(s.done / s.total) * 100}%` : "0%",
                  }}
                />
              </div>
            </button>
          );
        })}
      </section>

      <section className="flex gap-2 flex-wrap items-center">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher..."
          className="bg-panel-2 border border-border rounded px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:border-accent/50 focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={hideOwned}
            onChange={(e) => setHideOwned(e.target.checked)}
          />
          Cacher possédées
        </label>
      </section>

      {Object.entries(grouped).map(([type, list]) => (
        <section key={type} className="space-y-2">
          <h2 className="text-sm tracking-wider uppercase text-muted">
            {type} ({list.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list.map((it) => {
              const owned = !!checklist.state[it.uniqueName];
              const m = meta.get(it.uniqueName);
              const elColor = m.element ? ELEMENT_COLORS[m.element as Element] : "";
              return (
                <div
                  key={it.uniqueName}
                  className={`relative flex items-stretch rounded border transition ${
                    owned
                      ? "bg-done/10 border-done/40"
                      : "bg-panel-2 border-border hover:border-accent"
                  }`}
                >
                  <button
                    onClick={() => checklist.toggle(it.uniqueName)}
                    className={`flex-1 text-left p-2 ${owned ? "text-done" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${
                          owned ? "bg-done border-done" : "border-muted"
                        }`}
                      />
                      <span className="text-sm font-medium flex-1 truncate">
                        {it.name}
                      </span>
                      {it.masteryReq > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border tracking-wider ${
                            TYPE_COLOR[it.type] ?? "border-border text-muted"
                          }`}
                        >
                          MR{it.masteryReq}
                        </span>
                      )}
                    </div>
                    {(m.element || m.bonus != null) && (
                      <div className="flex items-center gap-1 mt-1.5 ml-5.5 pl-3.5">
                        {m.element && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${elColor}`}
                          >
                            {m.element}
                          </span>
                        )}
                        {m.bonus != null && (
                          <span className="text-[10px] text-accent-2 font-mono">
                            {m.bonus}%
                          </span>
                        )}
                      </div>
                    )}
                    {m.note && (
                      <div className="text-[10px] text-muted/80 mt-1 ml-5.5 pl-3.5 truncate">
                        {m.note}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(it);
                    }}
                    className="text-xs text-muted/40 hover:text-accent-2 px-2 self-stretch"
                    title="Édition détaillée"
                  >
                    ✎
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {!loading && filtered.length === 0 && (
        <div className="text-muted text-sm">Aucun résultat.</div>
      )}

      {editing && (
        <LichEditModal
          open
          itemLabel={editing.name}
          itemType={editing.type}
          meta={meta.get(editing.uniqueName)}
          onSave={(m) => meta.save(editing.uniqueName, m)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
