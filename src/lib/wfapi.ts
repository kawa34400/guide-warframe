"use client";
import { useEffect, useState } from "react";

const LANG = "fr";

export type Sortie = {
  expiry: string;
  boss: string;
  faction: string;
  variants: { missionType: string; modifier: string; node: string }[];
};

export type ArchonHunt = {
  expiry: string;
  boss: string;
  faction: string;
  missions: { type: string; nightmare: boolean; node: string }[];
  rewardPool?: string[];
};

export type Fissure = {
  id: string;
  node: string;
  missionType: string;
  enemy: string;
  tier: string;
  tierNum: number;
  isStorm: boolean;
  isHard: boolean;
  expiry: string;
  active: boolean;
};

export type VoidTrader = {
  active: boolean;
  character: string;
  location: string;
  startString: string;
  endString: string;
  activation: string;
  expiry: string;
  inventory: { item: string; ducats: number; credits: number }[];
};

export type SteelPath = {
  currentReward?: { name: string; cost: number };
  rotation?: { name: string; cost: number }[];
  remaining?: string;
  evergreens?: { name: string; cost: number }[];
};

export type Invasion = {
  id: string;
  node: string;
  desc?: string;
  attacker: { faction: string; reward?: { asString?: string } };
  defender: { faction: string; reward?: { asString?: string } };
  completion: number;
  completed: boolean;
  eta: string;
};

export type WfEvent = {
  id: string;
  description?: string;
  tooltip?: string;
  node?: string;
  expiry: string;
  rewards?: { asString?: string }[];
  health?: number;
  affiliatedWith?: string;
};

export type Arbitration = {
  activation: string;
  expiry: string;
  enemy: string;
  type: string;
  node: string;
  archwing?: boolean;
  eidolon?: boolean;
};

export type CalendarDay = {
  day: number;
  events: { type: string; reward?: string; challenge?: { title: string } }[];
};

export type Calendar = {
  expiry: string;
  yearIteration?: number;
  season?: string;
  days?: CalendarDay[];
};

export type Cycle = {
  state: string;
  expiry: string;
  timeLeft?: string;
  isDay?: boolean;
  isCetus?: boolean;
  isWarm?: boolean;
};

export type Nightwave = {
  expiry: string;
  season: number;
  tag: string;
  activeChallenges: {
    id: string;
    title: string;
    desc: string;
    reputation: number;
    isDaily?: boolean;
    isElite?: boolean;
  }[];
};

async function fetchJson<T>(path: string): Promise<T> {
  // warframestat.us removed the /pc/ platform prefix — endpoints are now flat.
  const r = await fetch(`/api/wf?p=${encodeURIComponent(path)}&language=${LANG}`);
  if (!r.ok) throw new Error(`wfapi ${path}: ${r.status}`);
  return r.json();
}

export function useWfData<T>(path: string, intervalMs = 60_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFetch = 0;

    const schedule = (delay: number) => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(load, delay);
    };

    const load = async () => {
      if (cancelled || document.visibilityState !== "visible") {
        schedule(intervalMs);
        return;
      }
      lastFetch = Date.now();
      try {
        const d = await fetchJson<T>(path);
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
      schedule(intervalMs);
    };

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      // refresh if stale (> intervalMs since last fetch) when tab regains focus
      if (Date.now() - lastFetch > intervalMs) load();
    };

    load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [path, intervalMs]);

  return { data, error, loading };
}

export function timeLeft(expiry: string, now = Date.now()): string {
  const ms = new Date(expiry).getTime() - now;
  if (ms <= 0) return "expiré";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}j ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
