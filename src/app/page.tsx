"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  currentIncarnonWeek,
  currentWarframeWeek,
  nextResetDate,
} from "@/lib/rotation";
import incarnon from "@/data/incarnon.json";

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="text-muted">Chargement...</div>;

  const wIncarnon = currentIncarnonWeek(now);
  const wWarframe = currentWarframeWeek(now);
  const reset = nextResetDate(now);
  const hoursUntilReset = Math.round(
    (reset.getTime() - now.getTime()) / (60 * 60 * 1000),
  );

  const incarnonThisWeek =
    (incarnon.incarnonRotation as Record<string, string[]>)[String(wIncarnon)] ?? [];
  const warframeThisWeek =
    (incarnon.warframeRotation as Record<string, string[]>)[String(wWarframe)] ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Guide Warframe</h1>
        <p className="text-muted text-sm">
          Reset hebdo dans ~{hoursUntilReset}h ({reset.toLocaleString("fr-FR")})
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              Incarnon — Semaine {wIncarnon}/{8}
            </h2>
            <Link href="/incarnon" className="text-accent text-sm">
              Tout voir →
            </Link>
          </div>
          <ul className="space-y-1">
            {incarnonThisWeek.map((w) => (
              <li key={w} className="text-sm">
                • {w}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              Warframes — Semaine {wWarframe}/11
            </h2>
            <Link href="/warframes" className="text-accent text-sm">
              Tout voir →
            </Link>
          </div>
          <ul className="space-y-1">
            {warframeThisWeek.map((w) => (
              <li key={w} className="text-sm">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-panel border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Sections</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            href="/construction"
            className="block p-3 bg-panel-2 border border-border rounded hover:border-accent transition"
          >
            <div className="font-medium">Construction</div>
            <div className="text-muted text-xs">
              Armes ressources & craftées
            </div>
          </Link>
          <Link
            href="/incarnon"
            className="block p-3 bg-panel-2 border border-border rounded hover:border-accent transition"
          >
            <div className="font-medium">Incarnon</div>
            <div className="text-muted text-xs">Évolutions + rotation 8 semaines</div>
          </Link>
          <Link
            href="/warframes"
            className="block p-3 bg-panel-2 border border-border rounded hover:border-accent transition"
          >
            <div className="font-medium">Warframes</div>
            <div className="text-muted text-xs">Rotation 11 semaines</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
