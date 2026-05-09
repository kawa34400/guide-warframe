"use client";
import { useMemo, useState } from "react";
import {
  useMasteryItems,
  categoryMeta,
  itemId,
  xpToMR,
  MASTERABLE_CATEGORIES,
  type WfItem,
} from "@/lib/mastery";
import { useChecklist } from "@/lib/storage";
import { useNotes } from "@/lib/notes";
import NoteButton from "@/components/NoteButton";

const CATEGORY_COLORS: Record<string, string> = {
  Warframes: "border-accent/40 text-accent",
  Primary: "border-accent-2/40 text-accent-2",
  Secondary: "border-warning/40 text-warning",
  Melee: "border-tier-requiem/40 text-tier-requiem",
  "Arch-Gun": "border-tier-axi/40 text-tier-axi",
  "Arch-Melee": "border-tier-axi/40 text-tier-axi",
  Sentinels: "border-tier-meso/40 text-tier-meso",
  SentinelWeapons: "border-tier-meso/40 text-tier-meso",
  Pets: "border-faction-infested/40 text-faction-infested",
  Archwing: "border-tier-omnia/40 text-tier-omnia",
  Necramech: "border-tier-omnia/40 text-tier-omnia",
  "K-Drive": "border-muted text-muted",
};

export default function MasteryPage() {
  const { items, loading, error } = useMasteryItems();
  const checklist = useChecklist("mastery");
  const notes = useNotes("mastery");

  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [hideMastered, setHideMastered] = useState(false);
  const [showOnlyMastered, setShowOnlyMastered] = useState(false);

  const stats = useMemo(() => {
    const byCat: Record<string, { total: number; done: number; xp: number }> = {};
    let totalXP = 0;
    for (const it of items) {
      const meta = categoryMeta(it.category);
      if (!meta) continue;
      const id = itemId(it);
      const done = !!checklist.state[id];
      if (!byCat[it.category])
        byCat[it.category] = { total: 0, done: 0, xp: 0 };
      byCat[it.category].total++;
      if (done) {
        byCat[it.category].done++;
        byCat[it.category].xp += meta.xp;
        totalXP += meta.xp;
      }
    }
    return { byCat, totalXP };
  }, [items, checklist.state]);

  const totalDone = Object.values(stats.byCat).reduce((a, c) => a + c.done, 0);
  const totalAll = Object.values(stats.byCat).reduce((a, c) => a + c.total, 0);
  const mr = xpToMR(stats.totalXP);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim();
    return items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (f && !it.name.toLowerCase().includes(f)) return false;
      const done = !!checklist.state[itemId(it)];
      if (hideMastered && done) return false;
      if (showOnlyMastered && !done) return false;
      return true;
    });
  }, [items, filter, category, hideMastered, showOnlyMastered, checklist.state]);

  // Group filtered items by category for display
  const grouped = useMemo(() => {
    const m: Record<string, WfItem[]> = {};
    for (const it of filtered) {
      (m[it.category] ||= []).push(it);
    }
    return m;
  }, [filtered]);

  if (error)
    return (
      <div className="text-danger">Erreur de chargement des items: {error}</div>
    );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mastery Rank</h1>
        <p className="text-muted text-sm">
          {loading
            ? "Chargement de la liste master..."
            : `${totalAll} items masterables · MR potentiel: ${mr.rank}`}
        </p>
      </header>

      {/* MR Stats */}
      <section className="panel notch p-5">
        <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="text-center">
            <div className="text-xs text-muted tracking-[0.2em] uppercase">
              MR Potentiel
            </div>
            <div className="font-display text-5xl text-glow text-accent">
              {mr.rank}
            </div>
            <div className="text-xs text-muted">
              {stats.totalXP.toLocaleString("fr-FR")} XP
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Items mastérisés</span>
              <span className="text-muted tabular-nums">
                {totalDone} / {totalAll}
              </span>
            </div>
            <div className="h-2 bg-panel-2 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500"
                style={{
                  width: `${totalAll ? (totalDone / totalAll) * 100 : 0}%`,
                }}
              />
            </div>
            {mr.rank < 30 && (
              <div className="text-[10px] text-muted">
                Prochain rang : {mr.xpToNext.toLocaleString("fr-FR")} XP restants
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Per-category breakdown */}
      <section>
        <h2 className="text-sm tracking-[0.25em] text-muted mb-3">
          Par catégorie
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`panel notch p-3 text-left transition ${
              category === "all" ? "border-accent/60" : ""
            }`}
          >
            <div className="text-xs text-muted tracking-wider uppercase">
              Tout
            </div>
            <div className="font-display text-xl">
              {totalDone}
              <span className="text-sm text-muted">/{totalAll}</span>
            </div>
          </button>
          {MASTERABLE_CATEGORIES.map((cat) => {
            const meta = categoryMeta(cat);
            const s = stats.byCat[cat] ?? { done: 0, total: 0 };
            if (!meta || s.total === 0) return null;
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(active ? "all" : cat)}
                className={`panel notch p-3 text-left transition ${
                  active ? "border-accent/60" : ""
                }`}
              >
                <div
                  className={`text-xs tracking-wider uppercase ${active ? "text-accent" : "text-muted"}`}
                >
                  {meta.label}
                </div>
                <div className="font-display text-xl">
                  {s.done}
                  <span className="text-sm text-muted">/{s.total}</span>
                </div>
                <div className="h-1 bg-panel-2 rounded mt-1 overflow-hidden">
                  <div
                    className="h-full bg-accent/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters */}
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
            checked={hideMastered}
            onChange={(e) => {
              setHideMastered(e.target.checked);
              if (e.target.checked) setShowOnlyMastered(false);
            }}
          />
          Cacher mastérisés
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showOnlyMastered}
            onChange={(e) => {
              setShowOnlyMastered(e.target.checked);
              if (e.target.checked) setHideMastered(false);
            }}
          />
          Uniquement mastérisés
        </label>
      </section>

      {/* Items list */}
      {Object.entries(grouped).map(([cat, list]) => {
        const meta = categoryMeta(cat);
        if (!meta) return null;
        const colorCls = CATEGORY_COLORS[cat] ?? "border-border text-muted";
        return (
          <section key={cat} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm tracking-wider uppercase text-muted">
                {meta.label}
              </h2>
              <span className="text-xs text-muted">
                ({list.length}) · {meta.xp} XP / item
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((it) => {
                const id = itemId(it);
                const done = !!checklist.state[id];
                return (
                  <div
                    key={id}
                    className={`relative flex items-stretch rounded border transition ${
                      done
                        ? "bg-done/10 border-done/40"
                        : "bg-panel-2 border-border hover:border-accent"
                    }`}
                  >
                    <button
                      onClick={() => checklist.toggle(id)}
                      className={`flex-1 flex items-center gap-2 text-left p-2 ${
                        done ? "text-done" : ""
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${
                          done ? "bg-done border-done" : "border-muted"
                        }`}
                      />
                      <span className="text-sm truncate flex-1">{it.name}</span>
                      {it.masteryReq != null && it.masteryReq > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border tracking-wider ${colorCls}`}
                          title={`Requiert MR ${it.masteryReq}`}
                        >
                          MR{it.masteryReq}
                        </span>
                      )}
                    </button>
                    <NoteButton
                      itemId={id}
                      itemLabel={it.name}
                      body={notes.get(id)}
                      onSave={(b) => notes.save(id, b)}
                      className="self-center mr-1"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {!loading && filtered.length === 0 && (
        <div className="text-muted text-sm">Aucun item ne correspond.</div>
      )}
    </div>
  );
}
