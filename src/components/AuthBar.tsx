"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthBar() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted hidden sm:inline">{user.email}</span>
        <button
          onClick={signOut}
          className="text-muted hover:text-text px-2 py-1 rounded hover:bg-panel-2"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, displayName || email.split("@")[0]);
    if (res.error) setError(res.error);
    else setOpen(false);
    setBusy(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-accent px-2 py-1 rounded hover:bg-panel-2"
      >
        Connexion
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <form
            onSubmit={submit}
            className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-1 bg-panel border border-border rounded-lg p-3 w-72 max-w-[calc(100vw-1rem)] z-50 space-y-2 shadow-xl"
          >
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-1 rounded ${
                  mode === "login" ? "bg-accent/20 text-accent" : "text-muted"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-1 rounded ${
                  mode === "signup" ? "bg-accent/20 text-accent" : "text-muted"
                }`}
              >
                Inscription
              </button>
            </div>

            {mode === "signup" && (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Pseudo (visible par tes amis)"
                className="w-full bg-panel-2 border border-border rounded px-2 py-1.5 text-sm"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              required
              className="w-full bg-panel-2 border border-border rounded px-2 py-1.5 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              className="w-full bg-panel-2 border border-border rounded px-2 py-1.5 text-sm"
            />
            {error && <div className="text-xs text-red-400">{error}</div>}
            <button
              disabled={busy}
              className="w-full bg-accent/20 text-accent border border-accent/40 rounded py-1.5 text-sm disabled:opacity-50"
            >
              {busy
                ? "..."
                : mode === "login"
                  ? "Se connecter"
                  : "Créer le compte"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
