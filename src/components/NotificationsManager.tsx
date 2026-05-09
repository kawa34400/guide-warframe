"use client";
import { useEffect, useRef } from "react";
import {
  loadPrefs,
  loadState,
  saveState,
  notify,
  type NotifPrefs,
} from "@/lib/notifications";

const PLATFORM = "pc";
const POLL_MS = 5 * 60 * 1000; // 5 min

async function get<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(
      `/api/wf?p=${encodeURIComponent(`${PLATFORM}/${path}`)}&language=fr`,
    );
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

function nextWeeklyResetUTC(now: Date): Date {
  const next = new Date(now);
  next.setUTCHours(0, 0, 0, 0);
  const day = next.getUTCDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  return next;
}

export default function NotificationsManager() {
  const lastTick = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      const prefs: NotifPrefs = loadPrefs();
      // If everything off → skip the network call entirely
      const anyOn = Object.values(prefs).some(Boolean);
      if (!anyOn) {
        timer = setTimeout(tick, POLL_MS);
        return;
      }
      lastTick.current = Date.now();
      const state = loadState();

      type Baro = { active?: boolean; location?: string };
      type Sortie = { id?: string; boss?: string };
      type Archon = { id?: string; boss?: string };
      type Cetus = { state?: string };

      const [baro, sortie, archon, cetus] = await Promise.all([
        prefs.baro ? get<Baro>("voidTrader") : Promise.resolve(null),
        prefs.sortie ? get<Sortie>("sortie") : Promise.resolve(null),
        prefs.archon ? get<Archon>("archonHunt") : Promise.resolve(null),
        prefs.eidolon ? get<Cetus>("cetusCycle") : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const newState = { ...state };

      // Baro: transition false→true
      if (prefs.baro && baro && typeof baro.active === "boolean") {
        if (baro.active && state.lastBaroActive === false) {
          notify(
            "🛒 Baro Ki'Teer",
            `Présent sur ${baro.location || "le système"}.`,
            { tag: "baro", url: "/live" },
          );
        }
        newState.lastBaroActive = baro.active;
      }

      // Sortie: id changed
      if (prefs.sortie && sortie && sortie.id) {
        if (state.lastSortieId && state.lastSortieId !== sortie.id) {
          notify(
            "⚔️ Nouvelle Sortie",
            sortie.boss ? `Boss : ${sortie.boss}` : "Disponible.",
            { tag: "sortie", url: "/today" },
          );
        }
        newState.lastSortieId = sortie.id;
      }

      // Archon: id changed
      if (prefs.archon && archon && archon.id) {
        if (state.lastArchonId && state.lastArchonId !== archon.id) {
          notify(
            "🌑 Nouvel Archon Hunt",
            archon.boss ? `Boss : ${archon.boss}` : "Disponible.",
            { tag: "archon", url: "/today" },
          );
        }
        newState.lastArchonId = archon.id;
      }

      // Eidolon: cetus day → night
      if (prefs.eidolon && cetus && cetus.state) {
        if (
          state.lastCetusState === "day" &&
          cetus.state === "night"
        ) {
          notify(
            "🌙 Nuit Cetus",
            "50 min pour chasser les Eidolons.",
            { tag: "cetus", url: "/live" },
          );
        }
        newState.lastCetusState = cetus.state;
      }

      // Weekly reset: ~1h before
      if (prefs.weekly) {
        const now = new Date();
        const reset = nextWeeklyResetUTC(now);
        const ms = reset.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;
        const isoKey = reset.toISOString();
        if (
          ms < oneHour &&
          ms > 0 &&
          state.lastWeeklyResetAt !== isoKey
        ) {
          notify(
            "⏰ Reset hebdo dans <1h",
            "Termine tes Nightwave / Sortie / Archon avant minuit UTC.",
            { tag: "weekly", url: "/today" },
          );
          newState.lastWeeklyResetAt = isoKey;
        }
      }

      saveState(newState);
      timer = setTimeout(tick, POLL_MS);
    };

    // Initial tick after a short delay to avoid blocking first paint
    timer = setTimeout(tick, 5000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
