// Nested layout for bubble routes — must NOT include <html>/<body>.
// Body styling for transparency is applied via the AppShell component
// in the root layout based on the current route.
export default function BubbleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
