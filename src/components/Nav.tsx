"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthBar from "./AuthBar";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/today", label: "Aujourd'hui" },
  { href: "/construction", label: "Construction" },
  { href: "/incarnon", label: "Incarnon" },
  { href: "/warframes", label: "Warframes" },
  { href: "/mastery", label: "Mastery" },
  { href: "/helminth", label: "Helminth" },
  { href: "/live", label: "Live" },
  { href: "/team", label: "Équipe" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="hidden md:block border-b border-border bg-bg-2/85 backdrop-blur-md sticky top-0 z-30 scanlines">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="font-display text-accent text-glow tracking-[0.15em] text-sm shrink-0 hover:opacity-80 transition"
        >
          ⟁ WARFRAME
        </Link>
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-1.5 rounded-md text-sm whitespace-nowrap font-display tracking-wider uppercase transition ${
                  active
                    ? "text-accent text-glow bg-accent/5"
                    : "text-muted hover:text-text"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                )}
              </Link>
            );
          })}
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
