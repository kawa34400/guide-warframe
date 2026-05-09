"use client";
import { useEffect, useState } from "react";
import {
  useWfData,
  timeLeft,
  type Sortie,
  type ArchonHunt,
  type Fissure,
  type VoidTrader,
  type Cycle,
} from "@/lib/wfapi";
import { nextResetDate } from "@/lib/rotation";

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    const onVis = () =>
      document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalMs]);
  return now;
}

function Row({
  label,
  value,
  countdown,
  faded,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  countdown?: string;
  faded?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`flex items-baseline gap-2 ${faded ? "opacity-50" : ""}`}
    >
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted shrink-0 w-14">
        {label}
      </span>
      <span className={`flex-1 text-sm truncate ${accent ?? ""}`}>{value}</span>
      {countdown && (
        <span className="text-[10px] tabular-nums font-mono text-muted shrink-0">
          {countdown}
        </span>
      )}
    </div>
  );
}

const FACTION_COLORS: Record<string, string> = {
  Grineer: "text-red-400",
  Corpus: "text-blue-400",
  Infested: "text-green-400",
  Sentient: "text-purple-400",
  Corrupted: "text-yellow-300",
};

export default function OverlayPage() {
  const now = useNow();

  const sortie = useWfData<Sortie>("sortie");
  const archon = useWfData<ArchonHunt>("archonHunt");
  const baro = useWfData<VoidTrader>("voidTrader");
  const fissures = useWfData<Fissure[]>("fissures", 60_000);

  const cetus = useWfData<Cycle>("cetusCycle", 30_000);
  const vallis = useWfData<Cycle>("vallisCycle", 30_000);
  const deimos = useWfData<Cycle>("cambionCycle", 30_000);
  const zariman = useWfData<Cycle>("zarimanCycle", 30_000);

  const reset = nextResetDate(new Date(now));
  const hoursToReset = Math.round((reset.getTime() - now) / (60 * 60 * 1000));

  const activeFissures = (fissures.data ?? []).filter(
    (f) => new Date(f.expiry).getTime() > now,
  );
  const fissCount: Record<string, number> = {};
  for (const f of activeFissures) fissCount[f.tier] = (fissCount[f.tier] ?? 0) + 1;

  const cycleStateColor = (state?: string) =>
    state === "day" || state === "fass" || state === "warm" || state === "corpus"
      ? "text-yellow-300"
      : state === "night" || state === "vome" || state === "cold" || state === "grineer"
        ? "text-cyan-300"
        : "text-muted";

  return (
    <div className="overlay-shell">
      {/* Drag handle (top strip) */}
      <div
        className="overlay-drag"
        data-tauri-drag-region
      >
        <span className="text-[10px] tracking-[0.3em] text-muted/70 uppercase">
          ⟁ Warframe
        </span>
        <span className="text-[10px] text-muted/50 ml-auto tabular-nums">
          {new Date(now).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="space-y-2 p-2.5">
        {/* Reset */}
        <Row
          label="Reset"
          value={
            <span className="text-accent">
              {hoursToReset > 0 ? `${hoursToReset}h` : "imminent"}
            </span>
          }
          countdown={reset.toLocaleString("fr-FR", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />

        {/* Sortie */}
        {sortie.data && (
          <Row
            label="Sortie"
            value={
              <span className={FACTION_COLORS[sortie.data.faction] ?? ""}>
                {sortie.data.boss}
              </span>
            }
            countdown={timeLeft(sortie.data.expiry, now)}
          />
        )}

        {/* Archon */}
        {archon.data && (
          <Row
            label="Archon"
            value={
              <span className="text-accent-3">{archon.data.boss}</span>
            }
            countdown={timeLeft(archon.data.expiry, now)}
          />
        )}

        {/* Baro */}
        {baro.data && (
          <Row
            label="Baro"
            value={
              baro.data.active ? (
                <span className="text-accent-2">@ {baro.data.location}</span>
              ) : (
                <span className="text-muted">arrive</span>
              )
            }
            countdown={timeLeft(
              baro.data.active ? baro.data.expiry : baro.data.activation,
              now,
            )}
          />
        )}

        <hr className="border-border/40 my-1" />

        {/* Cycles */}
        {cetus.data && (
          <Row
            label="Cetus"
            value={
              <span className={cycleStateColor(cetus.data.state)}>
                {cetus.data.state}
              </span>
            }
            countdown={timeLeft(cetus.data.expiry, now)}
          />
        )}
        {vallis.data && (
          <Row
            label="Vallis"
            value={
              <span className={cycleStateColor(vallis.data.state)}>
                {vallis.data.state}
              </span>
            }
            countdown={timeLeft(vallis.data.expiry, now)}
          />
        )}
        {deimos.data && (
          <Row
            label="Deimos"
            value={
              <span className={cycleStateColor(deimos.data.state)}>
                {deimos.data.state}
              </span>
            }
            countdown={timeLeft(deimos.data.expiry, now)}
          />
        )}
        {zariman.data && (
          <Row
            label="Zariman"
            value={
              <span className={cycleStateColor(zariman.data.state)}>
                {zariman.data.state}
              </span>
            }
            countdown={timeLeft(zariman.data.expiry, now)}
          />
        )}

        <hr className="border-border/40 my-1" />

        {/* Fissures */}
        {activeFissures.length > 0 && (
          <Row
            label="Fissures"
            value={
              <span className="flex items-center gap-1.5 text-xs">
                {Object.entries(fissCount).map(([tier, n]) => (
                  <span key={tier} className="text-muted">
                    <span className="text-text">{n}</span>
                    {tier.slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </span>
            }
          />
        )}
      </div>

      <style jsx global>{`
        html, body, #__next, .overlay-shell {
          background: rgba(11, 15, 20, 0.85);
          backdrop-filter: blur(8px);
        }
        .overlay-shell {
          min-height: 100vh;
          font-size: 12px;
          border: 1px solid rgba(95, 210, 255, 0.18);
          box-shadow: 0 0 24px rgba(95, 210, 255, 0.08);
        }
        .overlay-drag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          height: 22px;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(95, 210, 255, 0.1);
          cursor: grab;
          user-select: none;
        }
        .overlay-drag:active {
          cursor: grabbing;
        }
        body {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
