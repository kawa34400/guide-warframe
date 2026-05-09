"use client";
import { useMemo, useState } from "react";
import helminth from "@/data/helminth.json";
import { useChecklist } from "@/lib/storage";
import { useNotes } from "@/lib/notes";
import NoteButton from "@/components/NoteButton";

type Entry = { frame: string; ability: string };

export default function HelminthPage() {
  const data = helminth as Entry[];
  const checklist = useChecklist("helminth");
  const notes = useNotes("helminth");

  const [filter, setFilter] = useState("");
  const [hideDone, setHideDone] = useState(false);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim();
    return data.filter((e) => {
      const matches =
        !f ||
        e.frame.toLowerCase().includes(f) ||
        e.ability.toLowerCase().includes(f);
      if (!matches) return false;
      if (hideDone && checklist.state[e.frame]) return false;
      return true;
    });
  }, [data, filter, hideDone, checklist.state]);

  const done = data.filter((e) => checklist.state[e.frame]).length;
  const pct = Math.round((done / data.length) * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Helminth</h1>
        <p className="text-muted text-sm">
          Coche les Warframes que t&apos;as déjà nourries au Helminth — chaque
          frame nourrie débloque son ability pour subsumption sur les autres.
        </p>
      </header>

      {/* Stats */}
      <section className="panel notch p-5">
        <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="text-center">
            <div className="text-xs text-muted tracking-[0.2em] uppercase">
              Subsumées
            </div>
            <div className="font-display text-5xl text-glow text-accent">
              {done}
              <span className="text-2xl text-muted">/{data.length}</span>
            </div>
            <div className="text-xs text-muted tabular-nums">{pct}%</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted">
              Abilities débloquées par subsumption
            </div>
            <div className="h-2 bg-panel-2 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] text-muted">
              {data.length - done} frames restantes
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex gap-2 flex-wrap items-center">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher frame ou ability..."
          className="bg-panel-2 border border-border rounded px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:border-accent/50 focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          Cacher subsumées
        </label>
      </section>

      {/* List */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((e) => {
          const isDone = !!checklist.state[e.frame];
          const noteId = `frame:${e.frame}`;
          return (
            <div
              key={e.frame}
              className={`relative flex items-stretch rounded border transition ${
                isDone
                  ? "bg-done/10 border-done/40"
                  : "bg-panel-2 border-border hover:border-accent"
              }`}
            >
              <button
                onClick={() => checklist.toggle(e.frame)}
                className={`flex-1 flex flex-col gap-0.5 text-left p-2 ${
                  isDone ? "text-done" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${
                      isDone ? "bg-done border-done" : "border-muted"
                    }`}
                  />
                  <span className="text-sm font-medium">{e.frame}</span>
                </div>
                <span className="text-xs text-accent-2 ml-5.5 pl-3.5">
                  → {e.ability}
                </span>
              </button>
              <NoteButton
                itemId={noteId}
                itemLabel={`${e.frame} (${e.ability})`}
                body={notes.get(noteId)}
                onSave={(b) => notes.save(noteId, b)}
                className="self-center mr-1"
              />
            </div>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div className="text-muted text-sm">Aucun résultat.</div>
      )}

      <footer className="text-xs text-muted pt-4 border-t border-border">
        ⚠ Liste basée sur les abilities subsumables connues. Si DE en ajoute /
        modifie, edit{" "}
        <code className="text-text">src/data/helminth.json</code>.
      </footer>
    </div>
  );
}
