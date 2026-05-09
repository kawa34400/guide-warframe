// Server-side proxy for https://api.warframe.market/v1/* — adds caching and CORS-free access.
// Usage: /api/market?p=v1/items/boltor_prime_set/statistics
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Whitelist: only allow read paths under v1/items
const ALLOWED = /^v[12]\/items(?:\/[a-z0-9_]+(?:\/(?:orders|statistics))?)?$/;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p");
  if (!p || !ALLOWED.test(p)) {
    return Response.json({ error: "invalid_path" }, { status: 400 });
  }
  const upstream = `https://api.warframe.market/${p}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        accept: "application/json",
        "accept-language": "en",
        "user-agent": "guide-warframe/1.0",
      },
      // Cache 5 min on the edge — prices don't move that fast
      cache: "no-store",
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return Response.json(
      { error: "upstream_failed", message: String(e) },
      { status: 502 },
    );
  }
}
