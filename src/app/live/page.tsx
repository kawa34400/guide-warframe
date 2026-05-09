"use client";
import { useEffect, useState } from "react";
import {
  useWfData,
  timeLeft,
  type Sortie,
  type ArchonHunt,
  type Fissure,
  type VoidTrader,
  type SteelPath,
  type Nightwave,
  type Cycle,
} from "@/lib/wfapi";

const CYCLE_DEFS: {
  endpoint: string;
  label: string;
  states: Record<string, { emoji: string; color: string }>;
}[] = [
  {
    endpoint: "earthCycle",
    label: "Terre",
    states: {
      day: { emoji: "☀️", color: "text-yellow-300" },
      night: { emoji: "🌙", color: "text-blue-300" },
    },
  },
  {
    endpoint: "cetusCycle",
    label: "Cetus (Plaines d'Eidolon)",
    states: {
      day: { emoji: "☀️", color: "text-yellow-300" },
      night: { emoji: "🌙", color: "text-purple-300" },
    },
  },
  {
    endpoint: "vallisCycle",
    label: "Orb Vallis",
    states: {
      warm: { emoji: "🔥", color: "text-orange-300" },
      cold: { emoji: "❄️", color: "text-cyan-300" },
    },
  },
  {
    endpoint: "cambionCycle",
    label: "Cambion Drift (Deimos)",
    states: {
      fass: { emoji: "🟠", color: "text-orange-300" },
      vome: { emoji: "🔵", color: "text-blue-300" },
    },
  },
  {
    endpoint: "zarimanCycle",
    label: "Zariman",
    states: {
      corpus: { emoji: "🔷", color: "text-cyan-300" },
      grineer: { emoji: "🟥", color: "text-red-300" },
    },
  },
  {
    endpoint: "duviriCycle",
    label: "Duviri",
    states: {
      joy: { emoji: "😄", color: "text-yellow-300" },
      anger: { emoji: "😡", color: "text-red-300" },
      envy: { emoji: "😒", color: "text-green-300" },
      sorrow: { emoji: "😢", color: "text-blue-300" },
      fear: { emoji: "😨", color: "text-purple-300" },
    },
  },
];

function CycleRow({
  endpoint,
  label,
  states,
}: (typeof CYCLE_DEFS)[number]) {
  const { data, loading, error } = useWfData<Cycle>(endpoint, 30_000);
  const now = useNow();
  if (loading)
    return (
      <li className="flex justify-between text-sm text-muted">
        <span>{label}</span>
        <span>…</span>
      </li>
    );
  if (error || !data)
    return (
      <li className="flex justify-between text-sm text-muted">
        <span>{label}</span>
        <span>indisponible</span>
      </li>
    );
  const stateKey = (data.state || "").toLowerCase();
  const meta = states[stateKey] ?? { emoji: "•", color: "text-muted" };
  return (
    <li className="flex items-center justify-between gap-2 text-sm bg-panel-2 rounded px-2 py-1.5">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className={`${meta.color} font-medium capitalize`}>
          {meta.emoji} {data.state}
        </span>
        <span className="text-xs text-muted tabular-nums w-14 text-right">
          {timeLeft(data.expiry, now)}
        </span>
      </span>
    </li>
  );
}

function CyclesCard() {
  return (
    <Card title="Cycles">
      <ul className="space-y-1">
        {CYCLE_DEFS.map((c) => (
          <CycleRow key={c.endpoint} {...c} />
        ))}
      </ul>
    </Card>
  );
}

function Card({
  title,
  expires,
  children,
}: {
  title: string;
  expires?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-panel border border-border rounded-lg p-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        {expires && (
          <span className="text-xs text-muted tabular-nums">{expires}</span>
        )}
      </header>
      {children}
    </section>
  );
}

function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      stop();
      t = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (t) clearInterval(t);
      t = null;
    };
    const onVis = () =>
      document.visibilityState === "visible" ? start() : stop();
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalMs]);
  return now;
}

function SortieCard() {
  const { data, loading, error } = useWfData<Sortie>("sortie");
  const now = useNow();
  if (loading) return <Card title="Sortie">…</Card>;
  if (error || !data) return <Card title="Sortie">indisponible</Card>;
  return (
    <Card title={`Sortie — ${data.boss}`} expires={timeLeft(data.expiry, now)}>
      <ul className="space-y-1 text-sm">
        {data.variants.map((v, i) => (
          <li key={i}>
            <span className="text-accent">{v.missionType}</span> — {v.node}
            <div className="text-xs text-muted">{v.modifier}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ArchonCard() {
  const { data, loading, error } = useWfData<ArchonHunt>("archonHunt");
  const now = useNow();
  if (loading) return <Card title="Archon Hunt">…</Card>;
  if (error || !data) return <Card title="Archon Hunt">indisponible</Card>;
  return (
    <Card
      title={`Archon — ${data.boss}`}
      expires={timeLeft(data.expiry, now)}
    >
      <ul className="space-y-1 text-sm">
        {data.missions.map((m, i) => (
          <li key={i}>
            <span className="text-accent">{m.type}</span> — {m.node}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FissuresCard() {
  const { data, loading, error } = useWfData<Fissure[]>("fissures", 30_000);
  const now = useNow();
  if (loading) return <Card title="Fissures">…</Card>;
  if (error || !data) return <Card title="Fissures">indisponible</Card>;
  const active = data.filter(
    (f) => new Date(f.expiry).getTime() > now && f.active !== false,
  );
  active.sort((a, b) => a.tierNum - b.tierNum);
  const groups: Record<string, Fissure[]> = { Normal: [], "Steel Path": [], Railjack: [] };
  for (const f of active) {
    const k = f.isHard ? "Steel Path" : f.isStorm ? "Railjack" : "Normal";
    groups[k].push(f);
  }
  return (
    <Card title={`Fissures (${active.length})`}>
      <div className="space-y-3 text-sm">
        {Object.entries(groups).map(([label, list]) =>
          list.length === 0 ? null : (
            <div key={label}>
              <div className="text-xs text-muted mb-1">{label}</div>
              <ul className="space-y-1">
                {list.map((f) => (
                  <li
                    key={f.id}
                    className="flex justify-between gap-2 bg-panel-2 rounded px-2 py-1"
                  >
                    <span>
                      <span className="text-accent">{f.tier}</span>{" "}
                      {f.missionType}
                      <span className="text-muted"> · {f.node}</span>
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {timeLeft(f.expiry, now)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

function BaroCard() {
  const { data, loading, error } = useWfData<VoidTrader>("voidTrader");
  const now = useNow();
  if (loading) return <Card title="Baro Ki'Teer">…</Card>;
  if (error || !data) return <Card title="Baro Ki'Teer">indisponible</Card>;
  if (!data.active) {
    return (
      <Card title="Baro Ki'Teer" expires={timeLeft(data.activation, now)}>
        <div className="text-sm text-muted">
          Arrive {data.startString} sur {data.location}
        </div>
      </Card>
    );
  }
  return (
    <Card
      title={`Baro Ki'Teer — ${data.location}`}
      expires={timeLeft(data.expiry, now)}
    >
      <ul className="space-y-1 text-xs max-h-64 overflow-y-auto">
        {data.inventory.map((it, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span>{it.item}</span>
            <span className="text-muted tabular-nums">
              {it.ducats}d · {it.credits.toLocaleString()}cr
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SteelPathCard() {
  const { data, loading, error } = useWfData<SteelPath>("steelPath");
  if (loading) return <Card title="Steel Path">…</Card>;
  if (error || !data) return <Card title="Steel Path">indisponible</Card>;
  return (
    <Card title="Steel Path — Récompense de la semaine">
      {data.currentReward && (
        <div className="mb-2">
          <span className="text-accent text-base font-medium">
            {data.currentReward.name}
          </span>
          <span className="text-muted text-sm ml-2">
            · {data.currentReward.cost} essence
          </span>
        </div>
      )}
      {data.remaining && (
        <div className="text-xs text-muted mb-2">Reste : {data.remaining}</div>
      )}
      {data.evergreens && data.evergreens.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted">
            Evergreens ({data.evergreens.length})
          </summary>
          <ul className="mt-1 space-y-0.5">
            {data.evergreens.map((e, i) => (
              <li key={i} className="flex justify-between">
                <span>{e.name}</span>
                <span className="text-muted">{e.cost}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function NightwaveCard() {
  const { data, loading, error } = useWfData<Nightwave>("nightwave");
  const now = useNow();
  if (loading) return <Card title="Nightwave">…</Card>;
  if (error || !data) return <Card title="Nightwave">indisponible</Card>;
  const dailies = data.activeChallenges.filter((c) => c.isDaily);
  const weeklies = data.activeChallenges.filter((c) => !c.isDaily);
  return (
    <Card title={`Nightwave — ${data.tag}`} expires={timeLeft(data.expiry, now)}>
      <div className="space-y-3 text-sm">
        {[
          { label: "Quotidiens", list: dailies },
          { label: "Hebdo", list: weeklies },
        ].map(
          (g) =>
            g.list.length > 0 && (
              <div key={g.label}>
                <div className="text-xs text-muted mb-1">{g.label}</div>
                <ul className="space-y-1">
                  {g.list.map((c) => (
                    <li
                      key={c.id}
                      className="bg-panel-2 rounded px-2 py-1 flex justify-between gap-2"
                    >
                      <span>
                        {c.isElite && (
                          <span className="text-warning mr-1">★</span>
                        )}
                        {c.title}
                      </span>
                      <span className="text-muted text-xs tabular-nums">
                        {c.reputation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )}
      </div>
    </Card>
  );
}

export default function LivePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">État du monde — Live</h1>
        <p className="text-muted text-sm">
          Données via warframestat.us — refresh auto toutes les 30-60s
        </p>
      </header>
      <div className="grid lg:grid-cols-2 gap-4">
        <CyclesCard />
        <SortieCard />
        <ArchonCard />
        <SteelPathCard />
        <NightwaveCard />
        <FissuresCard />
        <BaroCard />
      </div>
    </div>
  );
}
