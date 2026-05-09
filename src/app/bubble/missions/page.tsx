"use client";
import { useEffect, useState } from "react";
import {
  useWfData,
  timeLeft,
  type Sortie,
  type ArchonHunt,
  type VoidTrader,
  type Fissure,
} from "@/lib/wfapi";
import BubbleShell from "@/components/BubbleShell";

function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const FACTION: Record<string, string> = {
  Grineer: "#f87171",
  Corpus: "#60a5fa",
  Infested: "#86efac",
  Sentient: "#c4b5fd",
  Corrupted: "#facc15",
};

export default function MissionsBubble() {
  const now = useNow();
  const sortie = useWfData<Sortie>("sortie");
  const archon = useWfData<ArchonHunt>("archonHunt");
  const baro = useWfData<VoidTrader>("voidTrader");
  const fissures = useWfData<Fissure[]>("fissures", 60_000);

  const activeFissures = (fissures.data ?? []).filter(
    (f) => new Date(f.expiry).getTime() > now,
  );
  const fissCount: Record<string, number> = {};
  for (const f of activeFissures) fissCount[f.tier] = (fissCount[f.tier] ?? 0) + 1;
  const tierOrder = ["Lith", "Meso", "Neo", "Axi", "Requiem", "Omnia"];

  return (
    <BubbleShell title="Missions" icon="🎯">
      {sortie.data && (
        <div className="bubble-row">
          <span className="label">Sortie</span>
          <span
            className="value"
            style={{ color: FACTION[sortie.data.faction] ?? "#e6edf5" }}
          >
            {sortie.data.boss}
          </span>
          <span className="timer">{timeLeft(sortie.data.expiry, now)}</span>
        </div>
      )}
      {archon.data && (
        <div className="bubble-row">
          <span className="label">Archon</span>
          <span className="value" style={{ color: "#b591ff" }}>
            {archon.data.boss}
          </span>
          <span className="timer">{timeLeft(archon.data.expiry, now)}</span>
        </div>
      )}
      {baro.data && (
        <div className="bubble-row">
          <span className="label">Baro</span>
          {baro.data.active ? (
            <>
              <span className="value" style={{ color: "#7be0c2" }}>
                @ {baro.data.location}
              </span>
              <span className="timer">{timeLeft(baro.data.expiry, now)}</span>
            </>
          ) : (
            <>
              <span className="value" style={{ color: "rgba(125,143,166,0.7)" }}>
                arrive
              </span>
              <span className="timer">{timeLeft(baro.data.activation, now)}</span>
            </>
          )}
        </div>
      )}
      {activeFissures.length > 0 && (
        <div className="bubble-row" style={{ marginTop: 4 }}>
          <span className="label">Fissures</span>
          <span className="value" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tierOrder
              .filter((t) => fissCount[t])
              .map((t) => (
                <span key={t}>
                  <span style={{ color: "#e6edf5", fontFamily: "ui-monospace, monospace" }}>
                    {fissCount[t]}
                  </span>
                  <span style={{ color: "rgba(125,143,166,0.7)", fontSize: 9, marginLeft: 1 }}>
                    {t.slice(0, 3)}
                  </span>
                </span>
              ))}
          </span>
        </div>
      )}
    </BubbleShell>
  );
}
