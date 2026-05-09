"use client";
import { useEffect, useRef, useState } from "react";
import {
  ELEMENTS,
  ELEMENT_COLORS,
  type Element,
  type LichMeta,
} from "@/lib/lich";

type Props = {
  open: boolean;
  itemLabel: string;
  itemType: "Kuva" | "Tenet" | "Hound";
  meta: LichMeta;
  onSave: (m: LichMeta) => void | Promise<void>;
  onClose: () => void;
};

export default function LichEditModal({
  open,
  itemLabel,
  itemType,
  meta,
  onSave,
  onClose,
}: Props) {
  const [element, setElement] = useState<Element | "">(meta.element ?? "");
  const [bonus, setBonus] = useState(
    meta.bonus != null ? String(meta.bonus) : "",
  );
  const [note, setNote] = useState(meta.note ?? "");
  const [busy, setBusy] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setElement(meta.element ?? "");
    setBonus(meta.bonus != null ? String(meta.bonus) : "");
    setNote(meta.note ?? "");
  }, [open, meta]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const next: LichMeta = {};
      if (element) next.element = element;
      if (bonus) {
        const n = parseInt(bonus, 10);
        if (!Number.isNaN(n)) next.bonus = n;
      }
      if (note.trim()) next.note = note.trim();
      await onSave(next);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const showElement = itemType !== "Hound";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md panel notch p-4 space-y-3">
        <header>
          <div className="text-xs text-muted tracking-wider uppercase mb-1">
            {itemType}
          </div>
          <h3 className="text-base text-accent text-glow">{itemLabel}</h3>
        </header>

        {showElement && (
          <>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider block mb-1">
                Élément du bonus
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setElement("")}
                  className={`text-xs px-2 py-1 rounded border ${
                    !element
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border text-muted"
                  }`}
                >
                  Aucun
                </button>
                {ELEMENTS.map((el) => (
                  <button
                    key={el}
                    type="button"
                    onClick={() => setElement(el)}
                    className={`text-xs px-2 py-1 rounded border ${
                      element === el ? ELEMENT_COLORS[el] : "border-border text-muted hover:border-accent/40"
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider block mb-1">
                Bonus % (25–60)
              </label>
              <input
                type="number"
                min={25}
                max={60}
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                placeholder="ex. 56"
                className="w-full bg-panel-2 border border-border rounded px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-muted uppercase tracking-wider block mb-1">
            Note libre
          </label>
          <textarea
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Forma 5x, build à finir, etc."
            className="w-full bg-panel-2 border border-border rounded px-3 py-2 text-sm resize-none focus:border-accent/50 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
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
  );
}
