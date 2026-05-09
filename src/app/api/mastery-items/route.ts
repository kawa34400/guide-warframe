// Server-side fetch + filter of warframestat /items to keep payload small.
// /items returns ~17k items (~40MB JSON); we trim to ~1k masterables (~200KB).
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MASTERABLE = new Set([
  "Warframes",
  "Primary",
  "Secondary",
  "Melee",
  "Arch-Gun",
  "Arch-Melee",
  "Sentinels",
  "SentinelWeapons",
  "Pets",
  "Archwing",
  "Necramech",
  "K-Drive",
]);

type RawItem = {
  uniqueName: string;
  name: string;
  category: string;
  type?: string;
  masteryReq?: number;
  productCategory?: string;
  imageName?: string;
  vaulted?: boolean;
};

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("language") ?? "fr";
  try {
    const res = await fetch(
      `https://api.warframestat.us/items/?language=${encodeURIComponent(lang)}`,
      {
        headers: { accept: "application/json" },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return Response.json(
        { error: "upstream", status: res.status },
        { status: res.status },
      );
    }
    const all = (await res.json()) as RawItem[];
    const slim = all
      .filter((it) => MASTERABLE.has(it.category))
      .map((it) => ({
        uniqueName: it.uniqueName,
        name: it.name,
        category: it.category,
        type: it.type,
        masteryReq: it.masteryReq ?? 0,
        imageName: it.imageName,
      }));

    return Response.json(slim, {
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
