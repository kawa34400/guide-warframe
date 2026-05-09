"use client";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { exportProgress, importProgress, downloadJson, type BackupFile } from "@/lib/backup";

export default function SettingsPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onExport = async () => {
    setBusy(true);
    try {
      const data = await exportProgress(user?.id ?? null);
      downloadJson(data, `warframe-progress-${new Date().toISOString().slice(0, 10)}.json`);
      setMsg("Export OK");
    } catch (e) {
      setMsg(`Erreur: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      const text = await f.text();
      const file = JSON.parse(text) as BackupFile;
      const res = await importProgress(file, user?.id ?? null);
      setMsg(`Import: ${res.inserted} entrées${res.skipped ? ` (${res.skipped} skip)` : ""}`);
    } catch (err) {
      setMsg(`Erreur: ${err}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted text-sm">
          Sauvegarde, import, gestion de ta progression.
        </p>
      </header>

      <section className="panel notch p-4 space-y-3">
        <h2 className="text-sm tracking-wider uppercase text-accent">
          Sauvegarde
        </h2>
        <p className="text-sm text-muted">
          {user
            ? "Source: Supabase (compte " + user.email + ")"
            : "Source: localStorage (mode anonyme)"}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onExport}
            disabled={busy}
            className="px-3 py-1.5 rounded border border-accent/40 text-accent bg-accent/10 hover:bg-accent/20 disabled:opacity-50 text-sm"
          >
            ↓ Exporter en JSON
          </button>
          <button
            onClick={onImportClick}
            disabled={busy}
            className="px-3 py-1.5 rounded border border-border hover:border-accent/40 text-text disabled:opacity-50 text-sm"
          >
            ↑ Importer un JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={onImportFile}
            className="hidden"
          />
        </div>
        {msg && <div className="text-xs text-muted">{msg}</div>}
      </section>

      <section className="panel notch p-4 space-y-2">
        <h2 className="text-sm tracking-wider uppercase text-accent">À propos</h2>
        <ul className="text-sm text-muted space-y-1">
          <li>
            Source data : <code className="text-text">CSV → JSON</code> +{" "}
            <a
              href="https://api.warframestat.us"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              warframestat.us
            </a>
          </li>
          <li>
            Repo :{" "}
            <a
              href="https://github.com/kawa34400/guide-warframe"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              kawa34400/guide-warframe
            </a>
          </li>
          <li>Raccourci : Ctrl+K pour la recherche globale</li>
        </ul>
      </section>
    </div>
  );
}
