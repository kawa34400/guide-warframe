"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthBar from "./AuthBar";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/construction", label: "Construction" },
  { href: "/incarnon", label: "Incarnon" },
  { href: "/warframes", label: "Warframes" },
  { href: "/live", label: "Live" },
  { href: "/team", label: "Équipe" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-border bg-panel/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <span className="font-semibold text-accent shrink-0">⟁ Warframe</span>
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition ${
                  active
                    ? "bg-panel-2 text-accent"
                    : "text-muted hover:text-text hover:bg-panel-2"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0">
          <AuthBar />
        </div>
      </div>
    </header>
  );
}
