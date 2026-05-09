import "../globals.css";

export default function BubbleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          background: "transparent",
          margin: 0,
          padding: 0,
          color: "#e6edf5",
          fontFamily:
            "ui-monospace, JetBrains Mono, Consolas, monospace",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
