"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useWfData,
  timeLeft,
  type Sortie,
  type ArchonHunt,
  type Nightwave,
  type VoidTrader,
  type Arbitration,
} from "@/lib/wfapi";
import { nextResetDate } from "@/lib/rotation";
import { nightwaveFr } from "@/lib/nightwave-fr";

function isPlaceholderArbi(
  data: { type?: string; node?: string; expiry?: string } | null,
  now: number,
): boolean {
  if (!data) return true;
  return (
    !data.type ||
    data.type === "Unknown" ||
    !!data.node?.startsWith("SolNode000") ||
    new Date(data.expiry ?? 0).getTime() <= now ||
    new Date(data.expiry ?? 0).getTime() - now > 365 * 24 * 60 * 60 * 1000
  );
}

function useNow(intervalMs = 30_000) {
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

function Block({
  title,
  children,
  href,
  countdown,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  countdown?: string;
}) {
  return (
    <section className="panel notch p-4">
      <header className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <h2 className="text-sm tracking-wider uppercase text-accent">
          {href ? (
            <Link href={href} className="hover:text-glow">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {countdown && (
          <span className="text-xs text-muted tabular-nums font-mono">
            {countdown}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

export default function TodayPage() {
  const now = useNow();
  const sortie = useWfData<Sortie>("sortie");
  const archon = useWfData<ArchonHunt>("archonHunt");
  const arbi = useWfData<Arbitration>("arbitration");
  const nw = useWfData<Nightwave>("nightwave");
  const baro = useWfData<VoidTrader>("voidTrader");

  const reset = nextResetDate(new Date(now));
  const hoursToReset = Math.round((reset.getTime() - now) / (60 * 60 * 1000));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Aujourd&apos;hui</h1>
        <p className="text-muted text-sm">
          Reset hebdo dans {hoursToReset}h · checklist du jour pour ne rien
          rater
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <Block
          title={
            sortie.data
              ? `Sortie — ${sortie.data.boss}`
              : "Sortie"
          }
          countdown={sortie.data ? timeLeft(sortie.data.expiry, now) : ""}
          href="/live"
        >
          {sortie.data ? (
            <ul className="space-y-1 text-sm">
              {sortie.data.variants.map((v, i) => (
                <li key={i}>
                  <span className="text-accent">{v.missionType}</span>
                  <span className="text-muted text-xs"> · {v.node}</span>
                  <div className="text-xs text-muted">{v.modifier}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted">…</div>
          )}
        </Block>

        <Block
          title={archon.data ? `Archon — ${archon.data.boss}` : "Archon"}
          countdown={archon.data ? timeLeft(archon.data.expiry, now) : ""}
          href="/live"
        >
          {archon.data ? (
            <ul className="space-y-1 text-sm">
              {archon.data.missions.map((m, i) => (
                <li key={i}>
                  <span className="text-accent-3">{m.type}</span>
                  <span className="text-muted text-xs"> · {m.node}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted">…</div>
          )}
        </Block>

        <Block title="Nightwave — Quotidiens" href="/live">
          {nw.data ? (
            <ul className="space-y-1 text-sm">
              {nw.data.activeChallenges
                .filter((c) => c.isDaily)
                .map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="truncate">{nightwaveFr(c.title)}</span>
                    <span className="text-xs text-muted tabular-nums">
                      {c.reputation}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="text-sm text-muted">…</div>
          )}
        </Block>

        <Block title="Nightwave — Hebdo" href="/live">
          {nw.data ? (
            <ul className="space-y-1 text-sm">
              {nw.data.activeChallenges
                .filter((c) => !c.isDaily)
                .map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {c.isElite && (
                        <span className="text-warning mr-1">★</span>
                      )}
                      {c.title}
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {c.reputation}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="text-sm text-muted">…</div>
          )}
        </Block>

        <Block
          title="Arbitration"
          countdown={
            arbi.data &&
            !isPlaceholderArbi(arbi.data, now)
              ? timeLeft(arbi.data.expiry, now)
              : ""
          }
          href="/live"
        >
          {arbi.data ? (
            isPlaceholderArbi(arbi.data, now) ? (
              <div className="text-sm text-muted">
                Pas d&apos;arbitration en cours.
              </div>
            ) : (
              <div className="text-sm">
                <span className="text-accent">{arbi.data.type}</span>
                <span className="text-muted text-xs ml-2">{arbi.data.node}</span>
                <div className="text-xs text-muted mt-1">{arbi.data.enemy}</div>
              </div>
            )
          ) : (
            <div className="text-sm text-muted">…</div>
          )}
        </Block>

        <Block title="Baro Ki'Teer" href="/live">
          {baro.data ? (
            baro.data.active ? (
              <div className="text-sm">
                <div className="text-accent">Présent · {baro.data.location}</div>
                <div className="text-xs text-muted">
                  {baro.data.inventory.length} items · part dans{" "}
                  {timeLeft(baro.data.expiry, now)}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <div className="text-muted">
                  Arrive dans {timeLeft(baro.data.activation, now)}
                </div>
                <div className="text-xs text-muted">
                  Sur {baro.data.location}
                </div>
              </div>
            )
          ) : (
            <div className="text-sm text-muted">…</div>
          )}
        </Block>
      </div>
    </div>
  );
}
