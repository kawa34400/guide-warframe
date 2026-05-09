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
async function fetchWithTimeout(input: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { signal: ctrl.signal, cache: "default" });
  } finally {
    clearTimeout(timer);
  }
}

async function loadSlugSet(): Promise<Set<string>> {
  if (slugListCache.slugs && Date.now() - slugListCache.loadedAt < 24 * 3600 * 1000) {
    return slugListCache.slugs;
  }
  try {
    const r = await fetchWithTimeout("/api/market?p=v2/items");
    if (!r.ok) throw new Error(`items list ${r.status}`);
    const j = await r.json();
    // v2 payload: { data: [{ slug, i18n: { en: { name } } }] }
    const items = j?.data ?? [];
    const set = new Set<string>(
      items.map((it: { slug: string }) => it.slug).filter(Boolean),
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
    const r = await fetchWithTimeout(
      `/api/market?p=v1/items/${encodeURIComponent(slug)}/statistics`,
    );
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
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const load = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const slugs = await loadSlugSet();
      if (slugs.size === 0) {
        setError("catalogue vide (API down ?)");
        return;
      }
      const allCandidates = candidateSlugs(name);
      const candidates = allCandidates.filter((s) => slugs.has(s));
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(
          "[market]",
          name,
          "tried:",
          allCandidates,
          "matched:",
          candidates,
        );
      }
      if (candidates.length === 0) {
        setError("pas sur le market");
        return;
      }
      for (const slug of candidates) {
        const s = await fetchStats(slug);
        if (s) {
          setData({ slug, stats: s });
          return;
        }
      }
      setError("pas de trades récents");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setTried(true);
    }
  }, [name]);

  useEffect(() => {
    if (eager) load();
  }, [eager, load]);

  return { data, loading, tried, error, load };
}
