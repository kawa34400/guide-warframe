// Server-side proxy for https://api.warframestat.us — adds caching and CORS-free access.
// Usage: GET /api/wf/pc/sortie?language=fr → fetches https://api.warframestat.us/pc/sortie?language=fr
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  if (!path || path.length === 0) {
    return Response.json({ error: "missing_path" }, { status: 400 });
  }
  const search = req.nextUrl.search;
  const upstream = `https://api.warframestat.us/${path.join("/")}${search}`;

  try {
    const res = await fetch(upstream, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return Response.json(
      { error: "upstream_failed", message: String(e) },
      { status: 502 },
    );
  }
}
