"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { openSearch } from "@/lib/search-bus";
import AuthBar from "./AuthBar";

type Tab =
  | { type: "link"; href: string; label: string; icon: string }
  | { type: "action"; label: string; icon: string; onClick: () => void; key: string };

export default function MobileNav() {
  const path = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  const tabs: Tab[] = [
    { type: "link", href: "/", label: "Accueil", icon: "⌂" },
    { type: "link", href: "/today", label: "Daily", icon: "✦" },
    { type: "link", href: "/live", label: "Live", icon: "◉" },
    {
      type: "action",
      key: "search",
      label: "Chercher",
      icon: "⌕",
      onClick: () => openSearch(),
    },
    {
      type: "action",
      key: "more",
      label: "Plus",
      icon: "≡",
      onClick: () => setDrawerOpen(true),
    },
  ];

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 border-b border-border bg-bg-2/85 backdrop-blur-md">
        <div className="px-4 h-12 flex items-center gap-2">
          <Link
            href="/"
            className="font-display text-accent text-glow tracking-[0.15em] text-sm"
          >
            ⟁ WARFRAME
          </Link>
          <div className="ml-auto">
            <AuthBar />
          </div>
        </div>
      </header>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-bg-2/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = t.type === "link" && path === t.href;
            const inner = (
              <span
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] tracking-wider uppercase font-display transition ${
                  active
                    ? "text-accent text-glow"
                    : "text-muted hover:text-text"
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </span>
            );
            if (t.type === "link") {
              return (
                <li key={t.href}>
                  <Link href={t.href} className="block">
                    {inner}
                  </Link>
                </li>
              );
            }
            return (
              <li key={t.key}>
                <button
                  type="button"
                  onClick={t.onClick}
                  className="block w-full"
                >
                  {inner}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {drawerOpen && (
        <Drawer onClose={() => setDrawerOpen(false)} currentPath={path} />
      )}
    </>
  );
}

function Drawer({
  onClose,
  currentPath,
}: {
  onClose: () => void;
  currentPath: string;
}) {
  const { user, signOut } = useAuth();
  const links = [
    { href: "/construction", label: "Construction" },
    { href: "/incarnon", label: "Incarnon" },
    { href: "/warframes", label: "Warframes" },
    { href: "/mastery", label: "Mastery Rank" },
    { href: "/team", label: "Équipe" },
    { href: "/settings", label: "Paramètres" },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-40 flex flex-col">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="bg-panel border-t border-border rounded-t-xl px-4 py-4 space-y-1"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm tracking-[0.2em] uppercase text-accent">
            Plus
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted text-lg w-8 h-8 flex items-center justify-center"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {links.map((l) => {
          const active = currentPath === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-3 rounded text-base transition ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-text hover:bg-panel-2"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <div className="pt-3 mt-3 border-t border-border">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted truncate">{user.email}</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-xs text-muted hover:text-text px-3 py-2 rounded hover:bg-panel-2"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              href="/?auth=1"
              className="block text-center text-sm text-accent py-2 rounded bg-accent/10 border border-accent/40"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
