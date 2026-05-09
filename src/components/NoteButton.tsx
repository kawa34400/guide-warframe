"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  itemId: string;
  itemLabel: string;
  body: string;
  onSave: (body: string) => void | Promise<void>;
  className?: string;
};

export default function NoteButton({
  itemId,
  itemLabel,
  body,
  onSave,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(body);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(body);
      setTimeout(() => taRef.current?.focus(), 30);
    }
  }, [open, body]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const hasNote = body.trim().length > 0;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSave(draft);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`text-xs px-1.5 rounded transition shrink-0 ${
          hasNote
            ? "text-accent-2 hover:bg-accent-2/10"
            : "text-muted/40 hover:text-muted hover:bg-panel-2"
        } ${className ?? ""}`}
        title={hasNote ? `Note: ${body.slice(0, 60)}${body.length > 60 ? "…" : ""}` : "Ajouter une note"}
        aria-label="Note"
      >
        {hasNote ? "✎" : "+"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md panel notch p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div className="text-xs text-muted tracking-wider uppercase mb-1">
                Note
              </div>
              <h3 className="text-base text-accent text-glow">{itemLabel}</h3>
            </header>
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Forma 5x, préfère Hunter Munitions, à éviter, etc."
              rows={6}
              className="w-full bg-panel-2 border border-border rounded px-3 py-2 text-sm resize-none focus:border-accent/50 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">
                Ctrl+Entrée pour sauvegarder · Échap pour fermer
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:text-text rounded hover:bg-panel-2"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50"
                >
                  {busy ? "..." : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
