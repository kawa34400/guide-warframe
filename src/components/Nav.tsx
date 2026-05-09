"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AuthBar from "./AuthBar";

const PRIMARY_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/today", label: "Aujourd'hui" },
  { href: "/live", label: "Live" },
  { href: "/team", label: "Équipe" },
];

const TRACKER_LINKS = [
  { href: "/construction", label: "Construction" },
  { href: "/incarnon", label: "Incarnon" },
  { href: "/warframes", label: "Warframes" },
  { href: "/mastery", label: "Mastery" },
  { href: "/helminth", label: "Helminth" },
  { href: "/lich", label: "Lich" },
];

const TRACKER_HREFS = new Set(TRACKER_LINKS.map((l) => l.href));

export default function Nav() {
  const path = usePathname();
  const [trackersOpen, setTrackersOpen] = useState(false);
  const trackersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTrackersOpen(false);
  }, [path]);

  useEffect(() => {
    if (!trackersOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!trackersRef.current?.contains(e.target as Node))
        setTrackersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTrackersOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [trackersOpen]);

  const trackersActive = TRACKER_HREFS.has(path);

  const renderLink = (l: { href: string; label: string }, active: boolean) => (
    <Link
      key={l.href}
      href={l.href}
      className={`relative px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap font-display tracking-[0.08em] uppercase transition ${
        active ? "text-accent text-glow bg-accent/5" : "text-muted hover:text-text"
      }`}
    >
      {l.label}
      {active && (
        <span className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}
    </Link>
  );

  return (
    <header className="hidden md:block border-b border-border bg-bg-2/85 backdrop-blur-md sticky top-0 z-30 scanlines">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="font-display text-accent text-glow tracking-[0.15em] text-sm shrink-0 hover:opacity-80 transition"
        >
          ⟁ WARFRAME
        </Link>

        <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {/* First two primary links */}
          {renderLink(PRIMARY_LINKS[0], path === PRIMARY_LINKS[0].href)}
          {renderLink(PRIMARY_LINKS[1], path === PRIMARY_LINKS[1].href)}

          {/* Trackers dropdown */}
          <div ref={trackersRef} className="relative">
            <button
              type="button"
              onClick={() => setTrackersOpen((o) => !o)}
              className={`relative px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap font-display tracking-[0.08em] uppercase transition flex items-center gap-1 ${
                trackersActive
                  ? "text-accent text-glow bg-accent/5"
                  : "text-muted hover:text-text"
              }`}
              aria-expanded={trackersOpen}
            >
              Trackers
              <span className="text-[8px]">▼</span>
              {trackersActive && (
                <span className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
              )}
            </button>
            {trackersOpen && (
              <div className="absolute left-0 top-full mt-1 panel notch w-44 py-1 z-40 shadow-xl">
                {TRACKER_LINKS.map((l) => {
                  const active = path === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`block px-3 py-2 text-xs uppercase tracking-[0.08em] font-display transition ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-text hover:bg-panel-2 hover:text-accent"
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remaining primary links */}
          {renderLink(PRIMARY_LINKS[2], path === PRIMARY_LINKS[2].href)}
          {renderLink(PRIMARY_LINKS[3], path === PRIMARY_LINKS[3].href)}
        </nav>

        <Link
          href="/settings"
          className={`shrink-0 px-2 py-1 rounded transition text-base ${
            path === "/settings"
              ? "text-accent"
              : "text-muted hover:text-text hover:bg-panel-2"
          }`}
          aria-label="Paramètres"
          title="Paramètres"
        >
          ⚙
        </Link>
        <div className="shrink-0">
          <AuthBar />
        </div>
      </div>
    </header>
  );
}
