"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth";
import { getSupabase } from "./supabase";

type State = Record<string, string>; // item_id → body

const localKey = (ns: string) => `wf:notes:${ns}`;

// Per-namespace cache hook: loads all notes for ns once, then provides per-item read/write.
export function useNotes(namespace: string) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<State>({});
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Fast paint from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey(namespace));
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, [namespace]);

  // Load from Supabase when auth resolves
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    userIdRef.current = user?.id ?? null;
    (async () => {
      const sb = getSupabase();
      if (user && sb) {
        const { data, error } = await sb
          .from("notes")
          .select("item_id, body")
          .eq("user_id", user.id)
          .eq("namespace", namespace);
        if (!cancelled && !error && data) {
          const next: State = {};
          for (const row of data) next[row.item_id] = row.body;
          setState(next);
          try {
            localStorage.setItem(localKey(namespace), JSON.stringify(next));
          } catch {}
        }
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, namespace]);

  // Mirror to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(localKey(namespace), JSON.stringify(state));
    } catch {}
  }, [namespace, state, loaded]);

  const get = useCallback((id: string) => state[id] ?? "", [state]);

  // Persist locally + remote (debounced upstream by component)
  const save = useCallback(
    async (id: string, body: string) => {
      setState((s) => {
        if ((s[id] ?? "") === body) return s;
        return { ...s, [id]: body };
      });
      const uid = userIdRef.current;
      const sb = getSupabase();
      if (uid && sb) {
        if (body.trim().length === 0) {
          await sb
            .from("notes")
            .delete()
            .eq("user_id", uid)
            .eq("namespace", namespace)
            .eq("item_id", id);
        } else {
          await sb.from("notes").upsert({
            user_id: uid,
            namespace,
            item_id: id,
            body,
          });
        }
      }
    },
    [namespace],
  );

  return { get, save, loaded, state };
}
