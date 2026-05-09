"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// In-memory cache for the session — avoids hammering the proxy when revisiting pages.
const slugListCache: { slugs: Set<string> | null; loadedAt: number } = {
  slugs: null,
  loadedAt: 0,
};
const statsCache = new Map<string, { ts: number; data: MarketStats | null }>();
const CACHE_MS = 5 * 60 * 1000;

export type MarketStats = {
  median: number;
  min: number;
  max: number;
  movingAvg?: number;
  volume?: number;
};

// Convert "Boltor Prime" → "boltor_prime", "Doubles Skanas" → "skana_dual"? — best-effort.
// For our use case (matching against warframe.market slugs), we strip diacritics, lowercase,
// underscore-join, and strip non-alphanum.
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''']/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// French → English best-effort. Many weapon names match across locales (proper nouns).
// We'll mostly try the French slug first, then fall back to "<base>_prime_set" guess.
const FR_TO_EN: Record<string, string> = {
  doubles_skanas: "dual_skana",
  doubles_zorens: "dual_zoren",
  doubles_kamas: "dual_kamas",
  doubles_ichor: "dual_ichor",
  doubles_razas: "dual_raza",
  doubles_cestras: "dual_cestra",
  doubles_hachoirs: "dual_cleavers",
  vipers_jumeaux: "twin_vipers",
  grataka_jumeaux: "twin_gremlins",
  basolk_jumeaux: "twin_basolk",
  kohmak_jumeaux: "twin_kohmak",
  krohkur_jumeaux: "twin_krohkur",
  epee_versatiles_sombres: "dark_split_sword",
  doubles_toxocyst: "dual_toxocyst",
  dagues_ceramique: "ceramic_dagger",
  war_brise: "broken_war",
  cernos_mutualiste: "mutalist_cernos",
};

export function candidateSlugs(name: string): string[] {
  const base = toSlug(name);
  const fr = FR_TO_EN[base];
  const out: string[] = [];
  if (fr) out.push(`${fr}_prime_set`, fr);
  out.push(`${base}_prime_set`, base);
  return out;
}

// Fetches the full slug catalog once (so we can know if a given slug exists before
// asking for stats — avoids 404 spam).
async function loadSlugSet(): Promise<Set<string>> {
  if (slugListCache.slugs && Date.now() - slugListCache.loadedAt < 24 * 3600 * 1000) {
    return slugListCache.slugs;
  }
  try {
    const r = await fetch("/api/market?p=v1/items");
    if (!r.ok) throw new Error(`items list ${r.status}`);
    const j = await r.json();
    // payload: { payload: { items: [{ url_name, item_name }] } }
    const items = j?.payload?.items ?? [];
    const set = new Set<string>(
      items.map((it: { url_name: string }) => it.url_name).filter(Boolean),
    );
    slugListCache.slugs = set;
    slugListCache.loadedAt = Date.now();
    return set;
  } catch {
    slugListCache.slugs = new Set();
    slugListCache.loadedAt = Date.now();
    return slugListCache.slugs;
  }
}

async function fetchStats(slug: string): Promise<MarketStats | null> {
  const cached = statsCache.get(slug);
  if (cached && Date.now() - cached.ts < CACHE_MS) return cached.data;

  try {
    const r = await fetch(`/api/market?p=v1/items/${encodeURIComponent(slug)}/statistics`);
    if (!r.ok) {
      statsCache.set(slug, { ts: Date.now(), data: null });
      return null;
    }
    const j = await r.json();
    // statistics_closed.90days[last] gives recent activity
    const arr =
      j?.payload?.statistics_closed?.["48hours"] ??
      j?.payload?.statistics_closed?.["90days"] ??
      [];
    if (!Array.isArray(arr) || arr.length === 0) {
      statsCache.set(slug, { ts: Date.now(), data: null });
      return null;
    }
    const latest = arr[arr.length - 1];
    const data: MarketStats = {
      median: Math.round(latest.median ?? latest.avg_price ?? 0),
      min: latest.min_price ?? 0,
      max: latest.max_price ?? 0,
      movingAvg: latest.moving_avg,
      volume: latest.volume,
    };
    statsCache.set(slug, { ts: Date.now(), data });
    return data;
  } catch {
    statsCache.set(slug, { ts: Date.now(), data: null });
    return null;
  }
}

// Resolves the best-matching slug for a weapon name and returns its stats.
export function useMarketPrice(name: string, eager = false) {
  const [data, setData] = useState<{ slug: string; stats: MarketStats } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (loading || tried) return;
    setLoading(true);
    cancelledRef.current = false;
    try {
      const slugs = await loadSlugSet();
      const candidates = candidateSlugs(name).filter((s) => slugs.has(s));
      for (const slug of candidates) {
        const s = await fetchStats(slug);
        if (cancelledRef.current) return;
        if (s) {
          setData({ slug, stats: s });
          break;
        }
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
        setTried(true);
      }
    }
  }, [name, loading, tried]);

  useEffect(() => {
    if (eager) load();
    return () => {
      cancelledRef.current = true;
    };
  }, [eager, load]);

  return { data, loading, tried, load };
}
