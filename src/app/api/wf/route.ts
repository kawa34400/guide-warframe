// Server-side proxy for https://api.warframestat.us — adds caching and CORS-free access.
// Usage: /api/wf?p=pc/sortie&language=fr → fetches https://api.warframestat.us/pc/sortie?language=fr
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const p = url.searchParams.get("p");
  if (!p) {
    return Response.json({ error: "missing_p_param" }, { status: 400 });
  }
  // Security: only allow alphanum + slashes (no .. traversal, no protocol)
  if (!/^[a-zA-Z0-9/_-]+$/.test(p)) {
    return Response.json({ error: "invalid_path" }, { status: 400 });
  }

  // Forward all other query params (e.g. language=fr)
  const forwarded = new URLSearchParams(url.searchParams);
  forwarded.delete("p");
  const qs = forwarded.toString();
  const upstream = `https://api.warframestat.us/${p}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(upstream, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    // Only cache successful responses; let Vercel re-hit upstream on errors so a
    // transient 404 from warframestat doesn't get pinned at the edge for 60s.
    const cacheControl = res.ok
      ? "public, s-maxage=60, stale-while-revalidate=300"
      : "no-store";
    return new Response(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": cacheControl,
      },
    });
  } catch (e) {
    return Response.json(
      { error: "upstream_failed", message: String(e) },
      { status: 502 },
    );
  }
}
