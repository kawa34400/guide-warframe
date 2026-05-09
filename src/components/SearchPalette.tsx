"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { flatCatalog } from "@/lib/catalog";
import { onOpenSearch } from "@/lib/search-bus";

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const catalog = useMemo(flatCatalog, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const off = onOpenSearch(() => setOpen(true));
    return () => {
      document.removeEventListener("keydown", onKey);
      off();
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return catalog
      .filter((it) => it.label.toLowerCase().includes(needle))
      .slice(0, 30);
  }, [q, catalog]);

  useEffect(() => {
    if (idx >= results.length) setIdx(0);
  }, [results.length, idx]);

  if (!open) return null;

  const go = (i: number) => {
    const item = results[i];
    if (!item) return;
    setOpen(false);
    router.push(`${item.page}?highlight=${encodeURIComponent(item.id)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(idx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl panel notch overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
          <span className="text-accent">⌘</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une arme, frame, item..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
          />
          <kbd className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && q.trim() && (
            <li className="px-4 py-3 text-sm text-muted">Aucun résultat</li>
          )}
          {results.length === 0 && !q.trim() && (
            <li className="px-4 py-3 text-xs text-muted">
              Tape pour chercher dans {catalog.length} items
            </li>
          )}
          {results.map((it, i) => (
            <li key={it.id}>
              <button
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(i)}
                className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm transition ${
                  i === idx
                    ? "bg-accent/15 text-accent"
                    : "text-text hover:bg-panel-2"
                }`}
              >
                <span className="text-[10px] text-muted uppercase tracking-wider w-20 shrink-0">
                  {it.ns}
                </span>
                <span className="flex-1 truncate">{it.label}</span>
                {i === idx && <span className="text-xs text-muted">↵</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 h-9 border-t border-border flex items-center gap-3 text-[10px] text-muted">
          <span><kbd className="border border-border rounded px-1">↑↓</kbd> nav</span>
          <span><kbd className="border border-border rounded px-1">↵</kbd> ouvrir</span>
          <span className="ml-auto">
            Ctrl+K pour ré-ouvrir
          </span>
        </div>
      </div>
    </div>
  );
}
