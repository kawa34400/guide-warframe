"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  currentIncarnonWeek,
  currentWarframeWeek,
  nextResetDate,
} from "@/lib/rotation";
import incarnon from "@/data/incarnon.json";
import { buildCatalog } from "@/lib/catalog";
import { useChecklist } from "@/lib/storage";

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const construction = useChecklist("construction");
  const incarnonProgress = useChecklist("incarnon");
  const warframes = useChecklist("warframes");
  const catalog = useMemo(buildCatalog, []);

  if (!now) return <div className="text-muted">Chargement...</div>;

  const wIncarnon = currentIncarnonWeek(now);
  const wWarframe = currentWarframeWeek(now);
  const reset = nextResetDate(now);
  const hoursUntilReset = Math.round(
    (reset.getTime() - now.getTime()) / (60 * 60 * 1000),
  );

  const incarnonThisWeek =
    (incarnon.incarnonRotation as Record<string, string[]>)[
      String(wIncarnon)
    ] ?? [];
  const warframeThisWeek =
    (incarnon.warframeRotation as Record<string, string[]>)[
      String(wWarframe)
    ] ?? [];

  const stats = [
    {
      ns: "Construction",
      done: catalog.construction.filter((it) => construction.state[it.id])
        .length,
      total: catalog.construction.length,
      href: "/construction",
    },
    {
      ns: "Incarnon",
      done: catalog.incarnon.filter((it) => incarnonProgress.state[it.id])
        .length,
      total: catalog.incarnon.length,
      href: "/incarnon",
    },
    {
      ns: "Warframes",
      done: catalog.warframes.filter((it) => warframes.state[it.id]).length,
      total: catalog.warframes.length,
      href: "/warframes",
    },
  ];

  const totalDone = stats.reduce((a, s) => a + s.done, 0);
  const totalAll = stats.reduce((a, s) => a + s.total, 0);
  const overallPct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-lg holo-border p-6">
        <div className="relative z-10">
          <div className="text-xs text-muted tracking-[0.3em] uppercase mb-2">
            Tenno Console
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-glow text-accent">
            Guide Warframe
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className="dot text-accent-2" />
            Reset hebdo dans {hoursUntilReset}h ·{" "}
            <span className="text-text/80">
              {reset.toLocaleString("fr-FR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute -right-32 -top-32 w-96 h-96 rounded-full border border-accent/10 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-accent/5 pointer-events-none"
        />
      </header>

      <section>
        <h2 className="text-sm tracking-[0.25em] text-muted mb-3">
          Progression
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            done={totalDone}
            total={totalAll}
            pct={overallPct}
            big
          />
          {stats.map((s) => (
            <StatCard
              key={s.ns}
              label={s.ns}
              done={s.done}
              total={s.total}
              pct={s.total ? Math.round((s.done / s.total) * 100) : 0}
              href={s.href}
            />
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <RotationCard
          href="/incarnon"
          title="Incarnon"
          subtitle={`Semaine ${wIncarnon} / 8`}
          items={incarnonThisWeek}
        />
        <RotationCard
          href="/warframes"
          title="Warframes"
          subtitle={`Semaine ${wWarframe} / 11`}
          items={warframeThisWeek}
        />
      </section>

      <section>
        <h2 className="text-sm tracking-[0.25em] text-muted mb-3">Sections</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <SectionTile
            href="/today"
            title="Aujourd'hui"
            desc="Sortie · Archon · Nightwave"
            badge="DAILY"
            accent
          />
          <SectionTile
            href="/live"
            title="Live"
            desc="Cycles · Fissures · Baro · Events"
            badge="API"
            accent
          />
          <SectionTile
            href="/team"
            title="Équipe"
            desc="Progression partagée du squad"
            badge="Sync"
          />
          <SectionTile
            href="/construction"
            title="Construction"
            desc="Armes ressources & craftées"
          />
          <SectionTile
            href="/incarnon"
            title="Incarnon"
            desc="Évolutions + rotation hebdo"
          />
          <SectionTile
            href="/mastery"
            title="Mastery"
            desc="~700 items + MR potentiel"
            badge="MR"
            accent
          />
          <SectionTile
            href="/helminth"
            title="Helminth"
            desc="Frames subsumées + abilities"
          />
          <SectionTile
            href="/settings"
            title="Paramètres"
            desc="Sauvegarde / Import"
          />
        </div>
      </section>

      <div className="text-center text-xs text-muted pt-4">
        <kbd className="border border-border rounded px-1.5 py-0.5 bg-panel-2">
          Ctrl + K
        </kbd>{" "}
        pour la recherche globale
      </div>
    </div>
  );
}

function StatCard({
  label,
  done,
  total,
  pct,
  href,
  big,
}: {
  label: string;
  done: number;
  total: number;
  pct: number;
  href?: string;
  big?: boolean;
}) {
  const inner = (
    <div className={`panel notch p-4 ${big ? "border-accent/40" : ""}`}>
      <div className="text-xs text-muted tracking-wider uppercase mb-1">
        {label}
      </div>
      <div
        className={`font-display ${big ? "text-3xl text-glow text-accent" : "text-xl"}`}
      >
        {pct}
        <span className="text-sm text-muted">%</span>
      </div>
      <div className="text-xs text-muted tabular-nums mb-2">
        {done} / {total}
      </div>
      <div className="h-1 bg-panel-2 rounded overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            big ? "bg-gradient-to-r from-accent to-accent-2" : "bg-accent/70"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90 transition">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function RotationCard({
  href,
  title,
  subtitle,
  items,
}: {
  href: string;
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <Link
      href={href}
      className="block panel notch p-5 holo-border hover:border-accent/50 transition group"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg text-accent text-glow">{title}</h2>
          <div className="text-xs text-muted tracking-wider uppercase">
            {subtitle}
          </div>
        </div>
        <span className="text-accent text-xs opacity-0 group-hover:opacity-100 transition">
          →
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((w) => (
          <li key={w} className="text-sm flex items-center gap-2 py-0.5">
            <span className="text-accent-2/60 text-xs">▸</span>
            {w}
          </li>
        ))}
      </ul>
    </Link>
  );
}

function SectionTile({
  href,
  title,
  desc,
  badge,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  badge?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block panel notch p-4 hover:border-accent/50 transition group relative"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-base tracking-wider uppercase group-hover:text-accent transition">
            {title}
          </div>
          <div className="text-muted text-xs mt-1">{desc}</div>
        </div>
        {badge && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border tracking-wider uppercase ${
              accent
                ? "border-accent-2/40 text-accent-2 bg-accent-2/10"
                : "border-border text-muted bg-panel-2"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}
