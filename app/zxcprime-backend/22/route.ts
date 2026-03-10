import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";

// ─── Worker URLs ──────────────────────────────────────────────────────────────
const FEBBOX_SHARE_WORKER = "https://febbox2.jinluxuz.workers.dev";
const FEBBOX_PLAYER_WORKER = "https://febbox3.jinluxuz.workers.dev";

// ─── Search engine: get FebBox share link ─────────────────────────────────────

async function fetchShareLinkFromSearch(
  title: string,
  year: string,
): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      "http://localhost:3000/zxcprime-backend/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: `febbox ${title} ${year} shared by showbox`,
        }),
      },
      8000,
    );

    if (!res.ok) return null;

    const data = await res.json();
    const results: { url: string }[] = data?.results ?? [];

    // Find the first febbox.com/share/... URL
    for (const result of results) {
      const match = result.url.match(/febbox\.com\/share\/([A-Za-z0-9_-]+)/);
      if (match) return `https://www.febbox.com/share/${match[1]}`;
    }

    return null;
  } catch (err: any) {
    console.warn("Search engine error:", err.message);
    return null;
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const tmdbId = req.nextUrl.searchParams.get("a");
    const mediaType = req.nextUrl.searchParams.get("b");
    const season = req.nextUrl.searchParams.get("c");
    const episode = req.nextUrl.searchParams.get("d");
    const title = req.nextUrl.searchParams.get("f");
    const year = req.nextUrl.searchParams.get("g");
    const ts = Number(req.nextUrl.searchParams.get("gago"));
    const token = req.nextUrl.searchParams.get("putanginamo")!;
    const f_token = req.nextUrl.searchParams.get("f_token")!;

    if (!tmdbId || !mediaType || !title || !year || !ts || !token) {
      return NextResponse.json(
        { success: false, error: "need token" },
        { status: 404 },
      );
    }

    if (Date.now() - ts > 8000) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    if (!validateBackendToken(tmdbId, f_token, ts, token)) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    const referer = req.headers.get("referer") || "";
    if (
      !referer.includes("/api/") &&
      !referer.includes("localhost") &&
      !referer.includes("http://192.168.1.4:3000/") &&
      !referer.includes("https://www.zxcstream.xyz/") &&
      !referer.includes("https://zxcstream.xyz/") &&
      !referer.includes("https://www.zxcprime.site/") &&
      !referer.includes("https://zxcprime.site/")
    ) {
      return NextResponse.json(
        { success: false, error: "NAH" },
        { status: 403 },
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Search engine: get FebBox share link
    // ─────────────────────────────────────────────────────────────────────────
    const shareLink = await fetchShareLinkFromSearch(title, year);

    console.log("shareLink from search", shareLink);

    if (!shareLink) {
      return NextResponse.json(
        {
          success: false,
          error: "Search engine returned no FebBox share link",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      link: shareLink,
    });
  } catch (err: any) {
    console.error("ShowBox/FebBox API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
