"use client";
import { useEffect, useState } from "react";
import incarnonData from "@/data/incarnon.json";
import { useChecklist } from "@/lib/storage";
import { useNotes } from "@/lib/notes";
import { currentWarframeWeek } from "@/lib/rotation";
import NoteButton from "@/components/NoteButton";
import MarketBadge from "@/components/MarketBadge";

export default function WarframesPage() {
  const data = incarnonData as {
    warframeRotation: Record<string, string[]>;
  };
  const checklist = useChecklist("warframes");
  const notes = useNotes("warframes");
  const [week, setWeek] = useState<number | null>(null);

  useEffect(() => {
    setWeek(currentWarframeWeek(new Date()));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Rotation Warframes</h1>
        <p className="text-muted text-sm">
          Coche celles que tu possèdes / as masterisées.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(data.warframeRotation).map(([w, list]) => {
          const isCurrent = week === parseInt(w, 10);
          return (
            <div
              key={w}
              className={`p-3 rounded-lg border transition ${
                isCurrent
                  ? "bg-accent/10 border-accent/60 pulse-glow"
                  : "bg-panel border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-display tracking-wider uppercase text-sm ${
                    isCurrent ? "text-accent text-glow" : ""
                  }`}
                >
                  Semaine {w}
                </span>
                {isCurrent && (
                  <span className="text-[10px] text-accent tracking-[0.2em] flex items-center gap-1">
                    <span className="dot text-accent" /> ACTIVE
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {list.map((n) => {
                  const id = `wf:${n}`;
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
                        className={`flex-1 text-left p-2 flex items-center gap-2 ${
                          done ? "text-done" : ""
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${
                            done ? "bg-done border-done" : "border-muted"
                          }`}
                        />
                        <span className="text-sm">{n}</span>
                      </button>
                      <MarketBadge name={n} className="self-center mr-1" />
                      <NoteButton
                        itemId={id}
                        itemLabel={n}
                        body={notes.get(id)}
                        onSave={(b) => notes.save(id, b)}
                        className="self-center mr-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
