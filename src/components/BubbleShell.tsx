"use client";
import { type ReactNode } from "react";

export default function BubbleShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bubble">
      <div className="drag" data-tauri-drag-region />
      <div className="body">{children}</div>

      <style jsx global>{`
        :root {
          --muted: #7d8fa6;
          --accent: #5fd2ff;
          --accent-2: #7be0c2;
          --accent-3: #b591ff;
        }
        html, body, #__next { background: transparent; margin: 0; padding: 0; }
        .bubble {
          margin: 3px;
          background: rgba(11, 15, 20, 0.78);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(95, 210, 255, 0.18);
          border-radius: 8px;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.35),
            0 4px 14px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          font-size: 11px;
          color: #e6edf5;
          width: calc(100vw - 6px);
          height: calc(100vh - 6px);
          display: flex;
          flex-direction: column;
        }
        .drag {
          height: 6px;
          cursor: grab;
          background: linear-gradient(
            to bottom,
            rgba(95, 210, 255, 0.06),
            transparent
          );
        }
        .drag:hover {
          background: linear-gradient(
            to bottom,
            rgba(95, 210, 255, 0.18),
            transparent
          );
        }
        .drag:active { cursor: grabbing; }
        .body {
          flex: 1;
          padding: 4px 8px 6px 8px;
          overflow: auto;
          min-height: 0;
        }
        .bubble-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding: 1px 0;
          font-size: 11px;
          line-height: 1.25;
          font-family: ui-monospace, "JetBrains Mono", monospace;
        }
        .bubble-row .label {
          color: var(--muted);
          width: 50px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .bubble-row .value { flex: 1; }
        .bubble-row .timer {
          color: rgba(125, 143, 166, 0.7);
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}
