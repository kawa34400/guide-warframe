"use client";
import { useMemo, useState } from "react";
import construction from "@/data/construction.json";
import { useChecklist } from "@/lib/storage";
import { useNotes } from "@/lib/notes";
import NoteButton from "@/components/NoteButton";

type Pair = {
  resource: { name: string; source: string | null } | null;
  built: { name: string; source: string | null } | null;
};
type Data = Record<string, Pair[]>;

const SOURCE_COLORS: Record<string, string> = {
  Marché: "bg-blue-500/20 text-blue-200 border-blue-500/40",
  Dojo: "bg-purple-500/20 text-purple-200 border-purple-500/40",
  Boss: "bg-red-500/20 text-red-200 border-red-500/40",
  "Drop en Mission": "bg-amber-500/20 text-amber-200 border-amber-500/40",
  "Céphalon Simaris": "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
  "Quête": "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
};

function SourceTag({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${
        SOURCE_COLORS[src] ?? "bg-gray-500/20 text-gray-300 border-gray-500/40"
      }`}
    >
      {src}
    </span>
  );
}

function WeaponCheck({
  id,
  name,
  source,
  done,
  onToggle,
  noteBody,
  onSaveNote,
}: {
  id: string;
  name: string;
  source: string | null;
  done: boolean;
  onToggle: (id: string) => void;
  noteBody: string;
  onSaveNote: (body: string) => void | Promise<void>;
}) {
  return (
    <div
      className={`relative flex items-stretch rounded border transition ${
        done
          ? "bg-done/10 border-done/40"
          : "bg-panel-2 border-border hover:border-accent"
      }`}
    >
      <button
        onClick={() => onToggle(id)}
        className={`flex-1 flex flex-col gap-1 text-left p-2 ${
          done ? "text-done" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${
              done ? "bg-done border-done" : "border-muted"
            }`}
          />
          <span className="text-sm font-medium truncate">{name}</span>
        </div>
        <SourceTag src={source} />
      </button>
      <NoteButton
        itemId={id}
        itemLabel={name}
        body={noteBody}
        onSave={onSaveNote}
        className="self-start mt-1.5 mr-1"
      />
    </div>
  );
}

export default function ConstructionPage() {
  const data = construction as Data;
  const [filter, setFilter] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const checklist = useChecklist("construction");
  const notes = useNotes("construction");

  const sections = useMemo(() => {
    const f = filter.toLowerCase().trim();
    const out: Record<string, Pair[]> = {};
    for (const [section, pairs] of Object.entries(data)) {
      out[section] = pairs.filter((p) => {
        const names = [p.resource?.name, p.built?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matches = !f || names.includes(f);
        if (!matches) return false;
        if (hideDone) {
          const rid = p.resource ? `${section}:res:${p.resource.name}` : null;
          const bid = p.built ? `${section}:built:${p.built.name}` : null;
          const rDone = rid ? checklist.state[rid] : true;
          const bDone = bid ? checklist.state[bid] : true;
          if (rDone && bDone) return false;
        }
        return true;
      });
    }
    return out;
  }, [data, filter, hideDone, checklist.state]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Construction</h1>
        <p className="text-muted text-sm">
          Coche les armes ressources lvl 30 et celles que tu as craftées.
        </p>
      </header>

      <div className="flex gap-2 flex-wrap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher..."
          className="bg-panel-2 border border-border rounded px-3 py-1.5 text-sm flex-1 min-w-[200px]"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          Cacher complétés
        </label>
      </div>

      {Object.entries(sections).map(([section, pairs]) => (
        <section key={section} className="bg-panel border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Armes {section}</h2>
          <div className="space-y-2">
            {pairs.map((p, i) => {
              const rid = p.resource
                ? `${section}:res:${p.resource.name}:${i}`
                : null;
              const bid = p.built
                ? `${section}:built:${p.built.name}:${i}`
                : null;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch"
                >
                  {p.resource && rid ? (
                    <WeaponCheck
                      id={rid}
                      name={p.resource.name}
                      source={p.resource.source}
                      done={!!checklist.state[rid]}
                      onToggle={checklist.toggle}
                      noteBody={notes.get(rid)}
                      onSaveNote={(b) => notes.save(rid, b)}
                    />
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center text-muted text-xs px-1">
                    →
                  </div>
                  {p.built && bid ? (
                    <WeaponCheck
                      id={bid}
                      name={p.built.name}
                      source={p.built.source}
                      done={!!checklist.state[bid]}
                      onToggle={checklist.toggle}
                      noteBody={notes.get(bid)}
                      onSaveNote={(b) => notes.save(bid, b)}
                    />
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
