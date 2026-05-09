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
  type Invasion,
  type WfEvent,
  type Arbitration,
  type Calendar,
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
  accent,
}: {
  title: React.ReactNode;
  expires?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section className="panel notch p-4 holo-border">
      <header className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <h2
          className={`text-sm tracking-wider uppercase ${accent ?? "text-accent"}`}
        >
          {title}
        </h2>
        {expires && (
          <span className="text-xs text-muted tabular-nums font-mono">
            {expires}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

const FACTION_COLORS: Record<string, string> = {
  Grineer: "text-faction-grineer",
  Corpus: "text-faction-corpus",
  Infested: "text-faction-infested",
  Sentient: "text-faction-sentient",
  Corrupted: "text-faction-corrupted",
  Orokin: "text-faction-corrupted",
};

const TIER_COLORS: Record<string, string> = {
  Lith: "text-tier-lith border-tier-lith/40 bg-tier-lith/10",
  Meso: "text-tier-meso border-tier-meso/40 bg-tier-meso/10",
  Neo: "text-tier-neo border-tier-neo/40 bg-tier-neo/10",
  Axi: "text-tier-axi border-tier-axi/40 bg-tier-axi/10",
  Requiem: "text-tier-requiem border-tier-requiem/40 bg-tier-requiem/10",
  Omnia: "text-tier-omnia border-tier-omnia/40 bg-tier-omnia/10",
};

function TierBadge({ tier }: { tier: string }) {
  const cls = TIER_COLORS[tier] ?? "text-muted border-border bg-panel-2";
  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded border tracking-wider font-display uppercase ${cls}`}
    >
      {tier}
    </span>
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
  const factionCls = FACTION_COLORS[data.faction] ?? "text-muted";
  return (
    <Card
      title={
        <span>
          Sortie — <span className={factionCls}>{data.boss}</span>
        </span>
      }
      expires={timeLeft(data.expiry, now)}
    >
      <ul className="space-y-2 text-sm">
        {data.variants.map((v, i) => (
          <li
            key={i}
            className="bg-panel-2/50 rounded px-2 py-1.5 border-l-2 border-accent/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-accent font-medium">{v.missionType}</span>
              <span className="text-muted text-xs">{v.node}</span>
            </div>
            <div className="text-xs text-muted/80 mt-0.5">{v.modifier}</div>
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
  const factionCls = FACTION_COLORS[data.faction] ?? "text-muted";
  return (
    <Card
      title={
        <span>
          Archon — <span className={factionCls}>{data.boss}</span>
        </span>
      }
      expires={timeLeft(data.expiry, now)}
    >
      <ul className="space-y-2 text-sm">
        {data.missions.map((m, i) => (
          <li
            key={i}
            className="bg-panel-2/50 rounded px-2 py-1.5 border-l-2 border-accent-3/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-accent-3 font-medium">{m.type}</span>
              <span className="text-muted text-xs">{m.node}</span>
            </div>
            {m.nightmare && (
              <span className="text-[10px] text-warning tracking-wider uppercase">
                ★ Nightmare
              </span>
            )}
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
                    className="flex items-center gap-2 bg-panel-2/50 rounded px-2 py-1"
                  >
                    <TierBadge tier={f.tier} />
                    <span className="flex-1">
                      {f.missionType}
                      <span className="text-muted text-xs ml-1.5">
                        {f.node}
                      </span>
                    </span>
                    <span className="text-xs text-muted tabular-nums font-mono">
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

function InvasionsCard() {
  const { data, loading, error } = useWfData<Invasion[]>("invasions");
  if (loading) return <Card title="Invasions">…</Card>;
  if (error || !data) return <Card title="Invasions">indisponible</Card>;
  const active = data.filter((i) => !i.completed);
  if (active.length === 0)
    return (
      <Card title="Invasions">
        <div className="text-sm text-muted">Aucune invasion en cours</div>
      </Card>
    );
  return (
    <Card title={`Invasions (${active.length})`}>
      <ul className="space-y-2 text-sm">
        {active.slice(0, 6).map((inv) => {
          const aFaction = FACTION_COLORS[inv.attacker.faction] ?? "text-muted";
          const dFaction = FACTION_COLORS[inv.defender.faction] ?? "text-muted";
          const pct = Math.round((inv.completion + 100) / 2);
          return (
            <li
              key={inv.id}
              className="bg-panel-2/50 rounded px-2 py-1.5"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={aFaction}>{inv.attacker.faction}</span>
                <span className="text-muted">{inv.node}</span>
                <span className={dFaction}>{inv.defender.faction}</span>
              </div>
              <div className="h-1.5 bg-panel-2 rounded overflow-hidden flex">
                <div
                  className="bg-faction-grineer/60"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="bg-faction-corpus/60"
                  style={{ width: `${100 - pct}%` }}
                />
              </div>
              <div className="text-xs text-muted mt-1 truncate">
                {inv.attacker.reward?.asString || "—"} vs{" "}
                {inv.defender.reward?.asString || "—"}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ArbitrationCard() {
  const { data, loading, error } = useWfData<Arbitration>("arbitration");
  const now = useNow();
  if (loading) return <Card title="Arbitration">…</Card>;
  if (error || !data) return <Card title="Arbitration">indisponible</Card>;
  const isPlaceholder =
    !data.type ||
    data.type === "Unknown" ||
    data.node?.startsWith("SolNode000") ||
    new Date(data.expiry).getTime() <= now;
  if (isPlaceholder) {
    return (
      <Card title="Arbitration">
        <div className="text-sm text-muted">
          Pas d&apos;arbitration en cours.
          <br />
          <span className="text-xs">
            Une nouvelle arbitration apparaît toutes les heures.
          </span>
        </div>
      </Card>
    );
  }
  const factionCls = FACTION_COLORS[data.enemy] ?? "text-muted";
  return (
    <Card title="Arbitration" expires={timeLeft(data.expiry, now)}>
      <div className="text-sm">
        <div className="flex items-center justify-between">
          <span className="text-accent font-medium">{data.type}</span>
          <span className={`text-xs ${factionCls}`}>{data.enemy}</span>
        </div>
        <div className="text-xs text-muted mt-1">{data.node}</div>
        {(data.archwing || data.eidolon) && (
          <div className="text-xs text-warning mt-1 tracking-wider uppercase">
            {data.archwing ? "★ Archwing" : "★ Eidolon"}
          </div>
        )}
      </div>
    </Card>
  );
}

function EventsCard() {
  const { data, loading, error } = useWfData<WfEvent[]>("events");
  const now = useNow();
  if (loading) return <Card title="Events">…</Card>;
  if (error || !data || data.length === 0)
    return (
      <Card title="Events">
        <div className="text-sm text-muted">Aucun event en cours</div>
      </Card>
    );
  return (
    <Card title={`Events (${data.length})`}>
      <ul className="space-y-2 text-sm">
        {data.slice(0, 5).map((e) => (
          <li key={e.id} className="bg-panel-2/50 rounded px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-accent font-medium truncate">
                {e.description || e.tooltip || "Event"}
              </span>
              {e.expiry && (
                <span className="text-xs text-muted tabular-nums shrink-0 ml-2">
                  {timeLeft(e.expiry, now)}
                </span>
              )}
            </div>
            {e.node && (
              <div className="text-xs text-muted mt-0.5">{e.node}</div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CalendarCard() {
  const { data, loading, error } = useWfData<Calendar>("duviriCycle/calendar");
  const now = useNow();
  if (loading) return <Card title="Calendrier 1999">…</Card>;
  if (error || !data || !data.days) {
    // Fallback to /1999/calendar if duviri sub-path doesn't exist
    return null;
  }
  return (
    <Card title="Calendrier 1999" expires={timeLeft(data.expiry, now)}>
      <ul className="space-y-1 text-sm">
        {data.days.slice(0, 7).map((d, i) => (
          <li
            key={i}
            className="flex items-center gap-2 bg-panel-2/50 rounded px-2 py-1"
          >
            <span className="font-display tracking-wider text-muted text-xs w-12 shrink-0">
              Jour {d.day}
            </span>
            <span className="flex-1 truncate">
              {d.events
                .map((ev) => ev.reward || ev.challenge?.title || ev.type)
                .join(" · ")}
            </span>
          </li>
        ))}
      </ul>
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
        <ArbitrationCard />
        <SteelPathCard />
        <NightwaveCard />
        <InvasionsCard />
        <EventsCard />
        <FissuresCard />
        <BaroCard />
      </div>
    </div>
  );
}
