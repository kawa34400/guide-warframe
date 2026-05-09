"use client";
// Tiny pubsub so any UI element can open the global search palette
// (mobile nav button, etc.) without prop drilling.
type Listener = () => void;
const listeners = new Set<Listener>();

export function openSearch() {
  for (const l of listeners) l();
}
export function onOpenSearch(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
