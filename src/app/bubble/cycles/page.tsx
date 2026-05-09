"use client";
import { useEffect, useState } from "react";
import { useWfData, timeLeft, type Cycle } from "@/lib/wfapi";
import BubbleShell from "@/components/BubbleShell";

function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const CYCLES: { id: string; label: string; icons: Record<string, string> }[] = [
  { id: "cetusCycle", label: "Cetus", icons: { day: "☀", night: "🌙" } },
  { id: "vallisCycle", label: "Vallis", icons: { warm: "🔥", cold: "❄" } },
  { id: "cambionCycle", label: "Deimos", icons: { fass: "🟠", vome: "🔵" } },
  { id: "zarimanCycle", label: "Zariman", icons: { corpus: "🔷", grineer: "🟥" } },
];

const STATE_COLOR: Record<string, string> = {
  day: "#facc15", warm: "#fb923c", fass: "#fb923c", corpus: "#5fd2ff",
  night: "#7dd3fc", cold: "#67e8f9", vome: "#60a5fa", grineer: "#f87171",
};

function CycleRow({ id, label, icons }: { id: string; label: string; icons: Record<string, string> }) {
  const { data } = useWfData<Cycle>(id, 30_000);
  const now = useNow();
  const state = (data?.state ?? "").toLowerCase();
  const icon = icons[state] ?? "•";
  const color = STATE_COLOR[state] ?? "#e6edf5";
  return (
    <div className="bubble-row">
      <span className="label">{label}</span>
      <span className="value" style={{ color }}>
        {icon} {state || "—"}
      </span>
      <span className="timer">{data ? timeLeft(data.expiry, now) : ""}</span>
    </div>
  );
}

export default function CyclesBubble() {
  return (
    <BubbleShell>
      {CYCLES.map((c) => (
        <CycleRow key={c.id} {...c} />
      ))}
    </BubbleShell>
  );
}
