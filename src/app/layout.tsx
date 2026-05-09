import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Providers from "./providers";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "Guide Warframe",
  description: "Tracker progression Warframe — construction, Incarnon, rotations",
  manifest: "/manifest.webmanifest",
  applicationName: "Guide Warframe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Warframe",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg text-text">
        <Providers>
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </Providers>
        <SwRegister />
      </body>
    </html>
  );
}
