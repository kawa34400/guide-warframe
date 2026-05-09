"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase } from "./supabase";
import { useAuth } from "./auth";

type State = Record<string, boolean>;

// Loads checklist for the given namespace.
// - If user is signed in: source of truth = Supabase, mirrored to localStorage.
// - If anonymous: localStorage only.
export function useChecklist(namespace: string) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<State>({});
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Load from local cache immediately (fast paint) then sync from Supabase.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`wf:${namespace}`);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, [namespace]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    userIdRef.current = user?.id ?? null;

    (async () => {
      const sb = getSupabase();
      if (user && sb) {
        const { data, error } = await sb
          .from("progress")
          .select("item_id, done")
          .eq("user_id", user.id)
          .eq("namespace", namespace);
        if (!cancelled && !error && data) {
          const next: State = {};
          for (const row of data) next[row.item_id] = row.done;
          setState(next);
          try {
            localStorage.setItem(`wf:${namespace}`, JSON.stringify(next));
          } catch {}
        }
      }
      if (!cancelled) setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, namespace]);

  // Mirror state to localStorage (for fast paint on next visit)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(`wf:${namespace}`, JSON.stringify(state));
    } catch {}
  }, [namespace, state, loaded]);

  const toggle = useCallback(
    (id: string) => {
      setState((s) => {
        const next = { ...s, [id]: !s[id] };
        const sb = getSupabase();
        const uid = userIdRef.current;
        if (uid && sb) {
          sb.from("progress")
            .upsert({
              user_id: uid,
              namespace,
              item_id: id,
              done: next[id],
            })
            .then(({ error }) => {
              if (error) console.error("[progress upsert]", error);
            });
        }
        return next;
      });
    },
    [namespace],
  );

  return { state, toggle, loaded };
}
