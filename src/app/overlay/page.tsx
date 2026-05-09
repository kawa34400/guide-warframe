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
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const FACTION_COLORS: Record<string, string> = {
  Grineer: "text-red-400",
  Corpus: "text-blue-400",
  Infested: "text-green-400",
  Sentient: "text-purple-400",
  Corrupted: "text-yellow-300",
};

function cycleColor(state?: string) {
  if (!state) return "text-muted";
  if (["day", "fass", "warm", "corpus"].includes(state)) return "text-yellow-300";
  if (["night", "vome", "cold", "grineer"].includes(state)) return "text-cyan-300";
  return "text-text";
}

function shortLabel(state?: string) {
  if (!state) return "?";
  if (state === "day") return "☀";
  if (state === "night") return "🌙";
  if (state === "warm") return "🔥";
  if (state === "cold") return "❄";
  if (state === "fass") return "🟠";
  if (state === "vome") return "🔵";
  if (state === "corpus") return "🔷";
  if (state === "grineer") return "🟥";
  return state.slice(0, 4);
}

export default function OverlayPage() {
  const now = useNow(15_000);

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

  // Build list of pages to cycle through
  const pages: { label: string; node: React.ReactNode }[] = [];

  pages.push({
    label: "Reset",
    node: (
      <>
        <span className="text-muted">Reset</span>
        <span className="ml-1.5 text-accent font-mono">
          {hoursToReset > 0 ? `${hoursToReset}h` : "imminent"}
        </span>
      </>
    ),
  });

  if (sortie.data) {
    pages.push({
      label: "Sortie",
      node: (
        <>
          <span className="text-muted">Sortie</span>
          <span
            className={`ml-1.5 ${FACTION_COLORS[sortie.data.faction] ?? "text-text"}`}
          >
            {sortie.data.boss}
          </span>
          <span className="ml-2 text-muted/70 font-mono">
            {timeLeft(sortie.data.expiry, now)}
          </span>
        </>
      ),
    });
  }

  if (archon.data) {
    pages.push({
      label: "Archon",
      node: (
        <>
          <span className="text-muted">Archon</span>
          <span className="ml-1.5 text-accent-3">{archon.data.boss}</span>
          <span className="ml-2 text-muted/70 font-mono">
            {timeLeft(archon.data.expiry, now)}
          </span>
        </>
      ),
    });
  }

  if (baro.data) {
    pages.push({
      label: "Baro",
      node: (
        <>
          <span className="text-muted">Baro</span>
          {baro.data.active ? (
            <>
              <span className="ml-1.5 text-accent-2">@ {baro.data.location}</span>
              <span className="ml-2 text-muted/70 font-mono">
                {timeLeft(baro.data.expiry, now)}
              </span>
            </>
          ) : (
            <span className="ml-1.5 text-muted/70 font-mono">
              dans {timeLeft(baro.data.activation, now)}
            </span>
          )}
        </>
      ),
    });
  }

  if (cetus.data) {
    pages.push({
      label: "Cetus",
      node: (
        <>
          <span className="text-muted">Cetus</span>
          <span className={`ml-1.5 ${cycleColor(cetus.data.state)}`}>
            {shortLabel(cetus.data.state)} {cetus.data.state}
          </span>
          <span className="ml-2 text-muted/70 font-mono">
            {timeLeft(cetus.data.expiry, now)}
          </span>
        </>
      ),
    });
  }

  if (vallis.data) {
    pages.push({
      label: "Vallis",
      node: (
        <>
          <span className="text-muted">Vallis</span>
          <span className={`ml-1.5 ${cycleColor(vallis.data.state)}`}>
            {shortLabel(vallis.data.state)} {vallis.data.state}
          </span>
          <span className="ml-2 text-muted/70 font-mono">
            {timeLeft(vallis.data.expiry, now)}
          </span>
        </>
      ),
    });
  }

  if (deimos.data) {
    pages.push({
      label: "Deimos",
      node: (
        <>
          <span className="text-muted">Deimos</span>
          <span className={`ml-1.5 ${cycleColor(deimos.data.state)}`}>
            {shortLabel(deimos.data.state)} {deimos.data.state}
          </span>
          <span className="ml-2 text-muted/70 font-mono">
            {timeLeft(deimos.data.expiry, now)}
          </span>
        </>
      ),
    });
  }

  if (zariman.data) {
    pages.push({
      label: "Zariman",
      node: (
        <>
          <span className="text-muted">Zariman</span>
          <span className={`ml-1.5 ${cycleColor(zariman.data.state)}`}>
            {shortLabel(zariman.data.state)} {zariman.data.state}
          </span>
          <span className="ml-2 text-muted/70 font-mono">
            {timeLeft(zariman.data.expiry, now)}
          </span>
        </>
      ),
    });
  }

  if (activeFissures.length > 0) {
    pages.push({
      label: "Fissures",
      node: (
        <>
          <span className="text-muted">Fissures</span>
          <span className="ml-1.5 flex items-center gap-1 inline-flex">
            {Object.entries(fissCount).map(([tier, n]) => (
              <span key={tier} className="text-text">
                <span className="font-mono">{n}</span>
                <span className="text-muted/60 text-[10px]">{tier.slice(0, 1)}</span>
              </span>
            ))}
          </span>
        </>
      ),
    });
  }

  const [page, setPage] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover || pages.length === 0) return;
    const t = setInterval(() => {
      setPage((p) => (p + 1) % Math.max(pages.length, 1));
    }, 4000);
    return () => clearInterval(t);
  }, [pages.length, hover]);

  const current = pages[page] ?? null;

  return (
    <div
      className="overlay-widget"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="drag-handle" data-tauri-drag-region>
        <span className="drag-dots">⋯</span>
      </div>

      {/* Compact cycling line */}
      {!hover && current && (
        <div className="line">
          <span className="text-[10px] text-accent/80 mr-1.5">⟁</span>
          {current.node}
        </div>
      )}

      {/* Hover-expanded full list */}
      {hover && (
        <div className="expanded">
          <div className="line text-[10px] text-accent/80">⟁ WARFRAME</div>
          {pages.map((p, i) => (
            <div key={i} className="line text-[11px]">
              {p.node}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        html, body, #__next { background: transparent; margin: 0; padding: 0; }
        body { color: #e6edf5; }
        :root {
          --muted: #7d8fa6;
          --accent: #5fd2ff;
          --accent-2: #7be0c2;
          --accent-3: #b591ff;
        }
        .text-muted { color: var(--muted); }
        .text-accent { color: var(--accent); }
        .text-accent-2 { color: var(--accent-2); }
        .text-accent-3 { color: var(--accent-3); }

        .overlay-widget {
          font-family: ui-monospace, "JetBrains Mono", "Consolas", monospace;
          font-size: 12px;
          line-height: 1.3;
          background: rgba(11, 15, 20, 0.78);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(95, 210, 255, 0.22);
          border-radius: 6px;
          padding: 4px 8px 6px 8px;
          color: #e6edf5;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 0 14px rgba(95, 210, 255, 0.08);
          width: fit-content;
          min-width: 200px;
          max-width: 360px;
          margin: 4px;
          overflow: hidden;
        }
        .drag-handle {
          height: 8px;
          margin: -4px -8px 4px -8px;
          padding: 0 8px;
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(125, 143, 166, 0.4);
          font-size: 10px;
          letter-spacing: 4px;
        }
        .drag-handle:active { cursor: grabbing; }
        .drag-dots {
          line-height: 8px;
        }
        .line {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 1px 0;
        }
        .expanded .line:first-child {
          margin-bottom: 2px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
