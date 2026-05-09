"use client";

export type NotifKey = "baro" | "sortie" | "archon" | "weekly" | "eidolon";

export type NotifPrefs = Record<NotifKey, boolean>;

export const DEFAULT_PREFS: NotifPrefs = {
  baro: false,
  sortie: false,
  archon: false,
  weekly: false,
  eidolon: false,
};

const PREFS_KEY = "wf:notif-prefs";
const STATE_KEY = "wf:notif-state";

export function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export function savePrefs(p: NotifPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

// Tracks "last seen" markers so we only notify once per event
type State = {
  lastBaroActive?: boolean;
  lastSortieId?: string;
  lastArchonId?: string;
  lastWeeklyResetAt?: string; // ISO of the reset we already announced
  lastCetusState?: string;
};

export function loadState(): State {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveState(s: State) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {}
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function notify(
  title: string,
  body: string,
  opts: { tag?: string; url?: string } = {},
) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: opts.tag,
    });
    if (opts.url) {
      n.onclick = () => {
        window.focus();
        if (opts.url && location.pathname !== opts.url) {
          location.href = opts.url;
        }
      };
    }
  } catch {}
}
