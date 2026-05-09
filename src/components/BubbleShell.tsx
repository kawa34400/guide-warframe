"use client";
import { type ReactNode } from "react";

export default function BubbleShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: ReactNode;
}) {
  return (
    <div className="bubble">
      <div className="bubble-header" data-tauri-drag-region>
        <span className="bubble-icon">{icon}</span>
        <span className="bubble-title">{title}</span>
        <span className="bubble-dots">⋯</span>
      </div>
      <div className="bubble-body">{children}</div>

      <style jsx global>{`
        :root {
          --muted: #7d8fa6;
          --accent: #5fd2ff;
          --accent-2: #7be0c2;
          --accent-3: #b591ff;
        }
        .bubble {
          margin: 4px;
          background: rgba(11, 15, 20, 0.78);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(95, 210, 255, 0.22);
          border-radius: 10px;
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.4),
            0 4px 18px rgba(0, 0, 0, 0.35),
            0 0 14px rgba(95, 210, 255, 0.06);
          overflow: hidden;
          font-size: 12px;
          color: #e6edf5;
          width: calc(100vw - 8px);
          height: calc(100vh - 8px);
          display: flex;
          flex-direction: column;
        }
        .bubble-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(95, 210, 255, 0.12);
          cursor: grab;
          user-select: none;
        }
        .bubble-header:active { cursor: grabbing; }
        .bubble-icon { font-size: 11px; }
        .bubble-title {
          flex: 1;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.85;
        }
        .bubble-dots {
          color: rgba(125, 143, 166, 0.4);
          letter-spacing: 2px;
          font-size: 11px;
        }
        .bubble-body {
          flex: 1;
          padding: 6px 8px 8px 8px;
          overflow: auto;
        }
        .bubble-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          padding: 2px 0;
          font-size: 11px;
          line-height: 1.3;
        }
        .bubble-row .label {
          color: var(--muted);
          width: 56px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          flex-shrink: 0;
        }
        .bubble-row .value { flex: 1; }
        .bubble-row .timer {
          color: rgba(125, 143, 166, 0.7);
          font-family: ui-monospace, monospace;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}
