"use client";
import { useEffect, useState } from "react";
import incarnonData from "@/data/incarnon.json";
import { useChecklist } from "@/lib/storage";
import { currentWarframeWeek } from "@/lib/rotation";

export default function WarframesPage() {
  const data = incarnonData as {
    warframeRotation: Record<string, string[]>;
  };
  const checklist = useChecklist("warframes");
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
              className={`p-3 rounded border ${
                isCurrent
                  ? "bg-accent/10 border-accent"
                  : "bg-panel border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Semaine {w}</span>
                {isCurrent && (
                  <span className="text-xs text-accent">EN COURS</span>
                )}
              </div>
              <div className="space-y-1">
                {list.map((n) => {
                  const id = `wf:${n}`;
                  const done = !!checklist.state[id];
                  return (
                    <button
                      key={id}
                      onClick={() => checklist.toggle(id)}
                      className={`w-full text-left p-2 rounded border transition flex items-center gap-2 ${
                        done
                          ? "bg-done/10 border-done/40 text-done"
                          : "bg-panel-2 border-border hover:border-accent"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${
                          done ? "bg-done border-done" : "border-muted"
                        }`}
                      />
                      <span className="text-sm">{n}</span>
                    </button>
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
