"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Nav from "./Nav";
import MobileNav from "./MobileNav";
import SearchPalette from "./SearchPalette";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const chromeless =
    path === "/overlay" || (path?.startsWith("/bubble") ?? false);

  // When chromeless, force the body to be transparent so the Tauri window
  // glass-effect shows through. Restore on regular routes.
  useEffect(() => {
    if (chromeless) {
      document.documentElement.classList.add("chromeless");
      document.body.classList.add("chromeless-body");
    } else {
      document.documentElement.classList.remove("chromeless");
      document.body.classList.remove("chromeless-body");
    }
  }, [chromeless]);

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      <MobileNav />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <SearchPalette />
    </>
  );
}
