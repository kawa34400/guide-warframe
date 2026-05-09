"use client";
import { useEffect, useState } from "react";
import { useNotes } from "./notes";

export type LichWeapon = {
  uniqueName: string;
  name: string;
  category: string;
  masteryReq: number;
  type: "Kuva" | "Tenet" | "Coda" | "Hound";
};

export const LICH_TYPES: { type: LichWeapon["type"]; label: string; sub: string }[] = [
  { type: "Kuva", label: "Kuva Lich", sub: "Grineer" },
  { type: "Tenet", label: "Tenet", sub: "Sister of Parvos" },
  { type: "Coda", label: "Coda", sub: "Infested · Technocyte" },
  { type: "Hound", label: "Hounds", sub: "Compagnons (Sister drop)" },
];

export const ELEMENTS = [
  "Heat",
  "Cold",
  "Electricity",
  "Toxin",
  "Magnetic",
  "Radiation",
  "Impact",
] as const;

export type Element = (typeof ELEMENTS)[number];

export const ELEMENT_COLORS: Record<Element, string> = {
  Heat: "text-orange-400 border-orange-400/40 bg-orange-500/10",
  Cold: "text-cyan-300 border-cyan-300/40 bg-cyan-500/10",
  Electricity: "text-yellow-300 border-yellow-300/40 bg-yellow-500/10",
  Toxin: "text-green-400 border-green-400/40 bg-green-500/10",
  Magnetic: "text-blue-400 border-blue-400/40 bg-blue-500/10",
  Radiation: "text-amber-300 border-amber-300/40 bg-amber-500/10",
  Impact: "text-zinc-300 border-zinc-300/40 bg-zinc-500/10",
};

export type LichMeta = {
  element?: Element;
  bonus?: number; // 25-60 for Kuva/Tenet
  note?: string;
};

let cache: { items: LichWeapon[]; loadedAt: number } | null = null;
const CACHE_MS = 30 * 60 * 1000;

export function useLichWeapons() {
  const [items, setItems] = useState<LichWeapon[]>(cache?.items ?? []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache && Date.now() - cache.loadedAt < CACHE_MS) {
      setItems(cache.items);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/lich-weapons?language=fr");
        if (!r.ok) throw new Error(`lich-weapons ${r.status}`);
        const list: LichWeapon[] = await r.json();
        list.sort((a, b) =>
          a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
        );
        if (cancelled) return;
        cache = { items: list, loadedAt: Date.now() };
        setItems(list);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}

// Reuse the notes hook but parse/serialize JSON
export function useLichMeta() {
  const notes = useNotes("lich");

  const get = (id: string): LichMeta => {
    const raw = notes.get(id);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed) return parsed;
    } catch {}
    // Backward-compat: treat as plain text note
    return { note: raw };
  };

  const save = async (id: string, meta: LichMeta) => {
    const cleaned: LichMeta = {};
    if (meta.element) cleaned.element = meta.element;
    if (typeof meta.bonus === "number" && !Number.isNaN(meta.bonus))
      cleaned.bonus = meta.bonus;
    if (meta.note) cleaned.note = meta.note;
    if (Object.keys(cleaned).length === 0) {
      await notes.save(id, "");
    } else {
      await notes.save(id, JSON.stringify(cleaned));
    }
  };

  return { get, save, loaded: notes.loaded };
}
