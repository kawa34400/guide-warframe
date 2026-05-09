"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  exportProgress,
  importProgress,
  downloadJson,
  type BackupFile,
} from "@/lib/backup";
import {
  loadPrefs,
  savePrefs,
  permissionState,
  requestPermission,
  notify,
  type NotifPrefs,
  DEFAULT_PREFS,
} from "@/lib/notifications";

const NOTIF_LABELS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  {
    key: "baro",
    label: "Baro Ki'Teer arrive",
    desc: "Quand le marchand devient actif (~2 semaines)",
  },
  {
    key: "sortie",
    label: "Nouvelle Sortie",
    desc: "Reset quotidien (~24h)",
  },
  {
    key: "archon",
    label: "Nouvel Archon Hunt",
    desc: "Reset hebdomadaire",
  },
  {
    key: "weekly",
    label: "Reset hebdo dans <1h",
    desc: "Lundi 00:00 UTC — finir Nightwave / Sortie",
  },
  {
    key: "eidolon",
    label: "Nuit Cetus",
    desc: "Eidolons disponibles 50 min",
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [permState, setPermState] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    setPrefs(loadPrefs());
    setPermState(permissionState());
  }, []);

  const onExport = async () => {
    setBusy(true);
    try {
      const data = await exportProgress(user?.id ?? null);
      downloadJson(
        data,
        `warframe-progress-${new Date().toISOString().slice(0, 10)}.json`,
      );
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
      setMsg(
        `Import: ${res.inserted} entrées${res.skipped ? ` (${res.skipped} skip)` : ""}`,
      );
    } catch (err) {
      setMsg(`Erreur: ${err}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const togglePref = async (key: keyof NotifPrefs, value: boolean) => {
    if (value && permState !== "granted") {
      const p = await requestPermission();
      setPermState(p);
      if (p !== "granted") {
        return; // user denied
      }
    }
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
  };

  const onTestNotif = async () => {
    if (permState !== "granted") {
      const p = await requestPermission();
      setPermState(p);
      if (p !== "granted") return;
    }
    notify("Test notification", "Ça marche, Tenno.", { tag: "test" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted text-sm">
          Sauvegarde, notifications, gestion de ta progression.
        </p>
      </header>

      {/* Notifications */}
      <section className="panel notch p-4 space-y-3">
        <h2 className="text-sm tracking-wider uppercase text-accent">
          Notifications
        </h2>
        <PermissionStatus
          state={permState}
          onTest={onTestNotif}
          onRequest={async () => setPermState(await requestPermission())}
        />
        <div className="space-y-2">
          {NOTIF_LABELS.map((n) => (
            <label
              key={n.key}
              className="flex items-start gap-3 p-2 rounded hover:bg-panel-2/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={prefs[n.key]}
                onChange={(e) => togglePref(n.key, e.target.checked)}
                disabled={permState === "unsupported"}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="text-sm">{n.label}</div>
                <div className="text-xs text-muted">{n.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-muted">
          ⓘ L&apos;app doit rester ouverte (onglet) pour recevoir les notifs.
          Polling toutes les 5 min.
        </p>
      </section>

      {/* Backup */}
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
        <h2 className="text-sm tracking-wider uppercase text-accent">
          À propos
        </h2>
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
            </a>{" "}
            +{" "}
            <a
              href="https://warframe.market"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              warframe.market
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

function PermissionStatus({
  state,
  onTest,
  onRequest,
}: {
  state: NotificationPermission | "unsupported";
  onTest: () => void;
  onRequest: () => void;
}) {
  if (state === "unsupported") {
    return (
      <div className="text-xs text-warning bg-warning/10 border border-warning/30 rounded p-2">
        Ton navigateur ne supporte pas les notifications.
      </div>
    );
  }
  if (state === "granted") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="dot text-done" />
        <span className="text-done">Permission accordée</span>
        <button
          onClick={onTest}
          className="ml-auto text-muted hover:text-text px-2 py-1 rounded hover:bg-panel-2"
        >
          Tester
        </button>
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="text-xs text-danger bg-danger/10 border border-danger/30 rounded p-2">
        Permission refusée. Ré-active les notifs dans les réglages du
        navigateur (cadenas dans la barre d&apos;URL).
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted">Permission non demandée</span>
      <button
        onClick={onRequest}
        className="ml-auto text-accent hover:bg-accent/10 px-2 py-1 rounded border border-accent/40"
      >
        Demander
      </button>
    </div>
  );
}
