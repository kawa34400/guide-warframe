// Week 2 of both rotations corresponds to the week of 2026-05-09 (anchor).
// Rotations refresh on Mondays at 00:00 UTC (Warframe weekly reset).
// We compute the current week index for each rotation length.

const ANCHOR_DATE = new Date("2026-05-04T00:00:00Z"); // Monday of anchor week
const ANCHOR_WEEK_INCARNON = 2;
const ANCHOR_WEEK_WARFRAME = 2;

export const INCARNON_LENGTH = 8;
export const WARFRAME_LENGTH = 11;

function weeksSinceAnchor(now: Date = new Date()): number {
  const ms = now.getTime() - ANCHOR_DATE.getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

export function currentIncarnonWeek(now: Date = new Date()): number {
  const w = ANCHOR_WEEK_INCARNON + weeksSinceAnchor(now);
  return ((w - 1) % INCARNON_LENGTH + INCARNON_LENGTH) % INCARNON_LENGTH + 1;
}

export function currentWarframeWeek(now: Date = new Date()): number {
  const w = ANCHOR_WEEK_WARFRAME + weeksSinceAnchor(now);
  return ((w - 1) % WARFRAME_LENGTH + WARFRAME_LENGTH) % WARFRAME_LENGTH + 1;
}

export function nextResetDate(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setUTCHours(0, 0, 0, 0);
  const day = next.getUTCDay(); // Sun=0, Mon=1
  const daysUntilMonday = (8 - day) % 7 || 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  return next;
}
