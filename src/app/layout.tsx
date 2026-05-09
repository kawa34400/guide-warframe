import type { Metadata, Viewport } from "next";
import { Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Providers from "./providers";
import SwRegister from "@/components/SwRegister";
import SearchPalette from "@/components/SearchPalette";
import NotificationsManager from "@/components/NotificationsManager";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-orbitron",
  display: "swap",
});

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
    <html
      lang="fr"
      className={`${rajdhani.variable} ${orbitron.variable}`}
    >
      <body className="min-h-screen bg-bg text-text">
        <Providers>
          <Nav />
          <MobileNav />
          <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {children}
          </main>
          <SearchPalette />
          <NotificationsManager />
        </Providers>
        <SwRegister />
      </body>
    </html>
  );
}
