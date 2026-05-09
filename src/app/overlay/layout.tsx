// Bypass the regular Nav/Mobile/Auth shell — overlay is a chromeless dense view.
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
