"use client";
import { useEffect, useState } from "react";

// Warframestat /items entry (subset of fields we use)
export type WfItem = {
  uniqueName: string;
  name: string;
  category: string; // "Warframes", "Primary", "Secondary", "Melee", "Sentinels", ...
  type?: string;
  masteryReq?: number;
  productCategory?: string;
  imageName?: string;
  vaulted?: boolean;
};

// Category groups for MR — each group's items at max rank give the same XP.
// Source: Warframe wiki — Mastery Rank affinity table.
const MASTERABLE: Record<string, { label: string; xp: number; level: number }> = {
  Warframes: { label: "Warframes", xp: 6000, level: 30 },
  Primary: { label: "Primaire", xp: 3000, level: 30 },
  Secondary: { label: "Secondaire", xp: 3000, level: 30 },
  Melee: { label: "Mélée", xp: 3000, level: 30 },
  "Arch-Gun": { label: "Arch-Gun", xp: 3000, level: 30 },
  "Arch-Melee": { label: "Arch-Mélée", xp: 3000, level: 30 },
  Sentinels: { label: "Sentinelle", xp: 6000, level: 30 },
  SentinelWeapons: { label: "Arme Sentinelle", xp: 3000, level: 30 },
  Pets: { label: "Compagnons", xp: 6000, level: 30 },
  Archwing: { label: "Archwing", xp: 6000, level: 30 },
  Necramech: { label: "Necramech", xp: 6000, level: 40 },
  "K-Drive": { label: "K-Drive", xp: 1500, level: 30 },
};

export const MASTERABLE_CATEGORIES = Object.keys(MASTERABLE);

export function categoryMeta(category: string) {
  return MASTERABLE[category] ?? null;
}

// MR thresholds: total XP needed to reach MR n.
// Up to MR 30: 1250 * n * (n+1). After that: linear.
const MR_30_XP = 1250 * 30 * 31; // 1,162,500
const POST_30_PER_RANK = 15000; // approximation; DE adjusts these

export function xpToMR(xp: number): { rank: number; xpInRank: number; xpToNext: number } {
  if (xp < MR_30_XP) {
    let rank = 0;
    while (1250 * (rank + 1) * (rank + 2) <= xp) rank++;
    const cur = 1250 * rank * (rank + 1);
    const next = 1250 * (rank + 1) * (rank + 2);
    return { rank, xpInRank: xp - cur, xpToNext: next - xp };
  }
  const over = xp - MR_30_XP;
  const extra = Math.floor(over / POST_30_PER_RANK);
  const cur = MR_30_XP + extra * POST_30_PER_RANK;
  return {
    rank: 30 + extra,
    xpInRank: xp - cur,
    xpToNext: POST_30_PER_RANK - (xp - cur),
  };
}

export function itemId(item: WfItem): string {
  return item.uniqueName;
}

let masteryCache: { items: WfItem[]; loadedAt: number } | null = null;
const CACHE_MS = 30 * 60 * 1000;

export function useMasteryItems() {
  const [items, setItems] = useState<WfItem[]>(masteryCache?.items ?? []);
  const [loading, setLoading] = useState(!masteryCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (masteryCache && Date.now() - masteryCache.loadedAt < CACHE_MS) {
      setItems(masteryCache.items);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/mastery-items?language=fr");
        if (!r.ok) throw new Error(`items ${r.status}`);
        const masterable: WfItem[] = await r.json();
        masterable.sort((a, b) =>
          a.category === b.category
            ? a.name.localeCompare(b.name)
            : a.category.localeCompare(b.category),
        );
        if (cancelled) return;
        masteryCache = { items: masterable, loadedAt: Date.now() };
        setItems(masterable);
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
