// Server-side list of Kuva (Lich) + Tenet (Sister) weapons + Hounds.
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RawWeapon = {
  uniqueName: string;
  name: string;
  category: string;
  type?: string;
  masteryReq?: number;
  imageName?: string;
};

// Hounds are modular companions (mix of 3 head models). We hardcode the 3 main
// models since warframestat doesn't expose them as weapons/items reliably.
const HOUNDS = [
  { uniqueName: "/Hound/Bhaira", name: "Bhaira", masteryReq: 15 },
  { uniqueName: "/Hound/Dorma", name: "Dorma", masteryReq: 15 },
  { uniqueName: "/Hound/Hec", name: "Hec", masteryReq: 15 },
];

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("language") ?? "fr";
  try {
    const r = await fetch(
      `https://api.warframestat.us/weapons/?language=${encodeURIComponent(lang)}`,
      { cache: "no-store" },
    );
    if (!r.ok) {
      return Response.json({ error: "upstream", status: r.status }, { status: r.status });
    }
    const all = (await r.json()) as RawWeapon[];

    // Filter by uniqueName path (stable across locales), since the FR translation
    // moves "Kuva" to suffix and renames Tenet → "Principe".
    const kuva = all
      .filter((w) => /\/KuvaLich\//.test(w.uniqueName))
      .map((w) => ({
        uniqueName: w.uniqueName,
        name: w.name,
        category: w.category,
        masteryReq: w.masteryReq ?? 0,
        type: "Kuva",
      }));

    const tenet = all
      .filter((w) => /\/BoardExec\//.test(w.uniqueName))
      .map((w) => ({
        uniqueName: w.uniqueName,
        name: w.name,
        category: w.category,
        masteryReq: w.masteryReq ?? 0,
        type: "Tenet",
      }));

    const hounds = HOUNDS.map((h) => ({
      uniqueName: h.uniqueName,
      name: h.name,
      category: "Hound",
      masteryReq: h.masteryReq,
      type: "Hound",
    }));

    return Response.json([...kuva, ...tenet, ...hounds], {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return Response.json(
      { error: "upstream_failed", message: String(e) },
      { status: 502 },
    );
  }
}
