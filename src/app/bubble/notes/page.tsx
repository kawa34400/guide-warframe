"use client";
import { useEffect, useState } from "react";
import BubbleShell from "@/components/BubbleShell";

const KEY = "wf:bubble-notes";

export default function NotesBubble() {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw != null) setText(raw);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, text);
        setSavedAt(Date.now());
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [text, loaded]);

  return (
    <BubbleShell>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Forma 5x Boltor · à farmer Citrine · etc."
        spellCheck={false}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#e6edf5",
          fontFamily: "inherit",
          fontSize: 11,
          lineHeight: 1.4,
          resize: "none",
          minHeight: 100,
        }}
      />
      {savedAt && (
        <div
          style={{
            fontSize: 8,
            color: "rgba(125,143,166,0.4)",
            position: "absolute",
            right: 4,
            bottom: 2,
            pointerEvents: "none",
          }}
        >
          ●
        </div>
      )}
    </BubbleShell>
  );
}
