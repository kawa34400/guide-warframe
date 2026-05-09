"use client";
import { getSupabase } from "./supabase";

const NAMESPACES = ["construction", "incarnon", "warframes"] as const;

export type BackupFile = {
  version: 1;
  exportedAt: string;
  source: "supabase" | "localstorage";
  data: Record<string, Record<string, boolean>>;
};

// Read all checklist state — prefer Supabase if logged in, else localStorage.
export async function exportProgress(userId: string | null): Promise<BackupFile> {
  const data: Record<string, Record<string, boolean>> = {};
  let source: "supabase" | "localstorage" = "localstorage";

  if (userId) {
    const sb = getSupabase();
    if (sb) {
      const { data: rows, error } = await sb
        .from("progress")
        .select("namespace, item_id, done")
        .eq("user_id", userId);
      if (!error && rows) {
        for (const r of rows) {
          (data[r.namespace] ||= {})[r.item_id] = r.done;
        }
        source = "supabase";
      }
    }
  }

  if (source === "localstorage") {
    for (const ns of NAMESPACES) {
      try {
        const raw = localStorage.getItem(`wf:${ns}`);
        if (raw) data[ns] = JSON.parse(raw);
      } catch {}
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source,
    data,
  };
}

export function downloadJson(file: BackupFile, filename = "warframe-progress.json") {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function importProgress(
  file: BackupFile,
  userId: string | null,
): Promise<{ inserted: number; skipped: number }> {
  if (file.version !== 1) throw new Error("version backup non supportée");

  // Always update localStorage
  for (const [ns, items] of Object.entries(file.data)) {
    try {
      localStorage.setItem(`wf:${ns}`, JSON.stringify(items));
    } catch {}
  }

  let inserted = 0;
  let skipped = 0;

  if (userId) {
    const sb = getSupabase();
    if (sb) {
      const rows: { user_id: string; namespace: string; item_id: string; done: boolean }[] = [];
      for (const [ns, items] of Object.entries(file.data)) {
        for (const [item_id, done] of Object.entries(items)) {
          rows.push({ user_id: userId, namespace: ns, item_id, done });
        }
      }
      // Upsert in batches of 500 to avoid payload limits
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await sb.from("progress").upsert(batch);
        if (error) skipped += batch.length;
        else inserted += batch.length;
      }
    }
  } else {
    inserted = Object.values(file.data).reduce(
      (acc, items) => acc + Object.keys(items).length,
      0,
    );
  }

  return { inserted, skipped };
}
