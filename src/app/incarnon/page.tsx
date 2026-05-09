"use client";
import { useEffect, useState } from "react";
import incarnonData from "@/data/incarnon.json";
import { useChecklist } from "@/lib/storage";
import { useNotes } from "@/lib/notes";
import { currentIncarnonWeek } from "@/lib/rotation";
import NoteButton from "@/components/NoteButton";
import MarketBadge from "@/components/MarketBadge";

export default function IncarnonPage() {
  const data = incarnonData as {
    evolutions: string[];
    evolutionsZariman: string[];
    incarnonRotation: Record<string, string[]>;
  };
  const checklist = useChecklist("incarnon");
  const notes = useNotes("incarnon");
  const [week, setWeek] = useState<number | null>(null);

  useEffect(() => {
    setWeek(currentIncarnonWeek(new Date()));
  }, []);

  const renderItem = (name: string, prefix: string) => {
    const id = `${prefix}:${name}`;
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
          <span className="text-sm truncate">{name}</span>
        </button>
        <MarketBadge name={name} className="self-center mr-1" />
        <NoteButton
          itemId={id}
          itemLabel={name}
          body={notes.get(id)}
          onSave={(b) => notes.save(id, b)}
          className="self-center mr-1"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Incarnon</h1>
        <p className="text-muted text-sm">
          Évolutions débloquées + rotation hebdomadaire des adaptateurs.
        </p>
      </header>

      <section className="bg-panel border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">
          Rotation des adaptateurs (8 semaines)
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(data.incarnonRotation).map(([w, list]) => {
            const isCurrent = week === parseInt(w, 10);
            return (
              <div
                key={w}
                className={`p-3 rounded-lg border transition ${
                  isCurrent
                    ? "bg-accent/10 border-accent/60 pulse-glow"
                    : "bg-panel-2/50 border-border"
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
                  {list.map((n) => renderItem(n, `rot:${w}`))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-panel border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">
          Évolutions débloquées ({data.evolutions.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {data.evolutions.map((n) => renderItem(n, "evo"))}
        </div>
      </section>

      <section className="bg-panel border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Zariman</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {data.evolutionsZariman.map((n) => renderItem(n, "zariman"))}
        </div>
      </section>
    </div>
  );
}
