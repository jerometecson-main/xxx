import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { searchFebboxShareLink } from "@/lib/febbox-search";

const FEBBOX_SHARE_WORKER = "https://febbox2.jinluxuz.workers.dev";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tmdbId = searchParams.get("a");
    const mediaType = searchParams.get("b");
    const season = searchParams.get("c");
    const episode = searchParams.get("d");
    const title = searchParams.get("f");
    const year = searchParams.get("g");
    const ts = Number(searchParams.get("gago"));
    const token = searchParams.get("putanginamo")!;
    const f_token = searchParams.get("f_token")!;

    if (!tmdbId || !mediaType || !title || !year || !ts || !token)
      return NextResponse.json(
        { success: false, error: "Missing params" },
        { status: 400 },
      );

    if (Date.now() - ts > 8000)
      return NextResponse.json(
        { success: false, error: "Token expired" },
        { status: 403 },
      );

    if (!validateBackendToken(tmdbId, f_token, ts, token))
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );

    // STEP 1
    const shareLink = await searchFebboxShareLink(title, year);
    if (!shareLink)
      return NextResponse.json(
        { success: false, error: "No FebBox share link found" },
        { status: 502 },
      );

    const shareToken = shareLink.split("/share/")[1];
    if (!shareToken)
      return NextResponse.json(
        { success: false, error: "Could not parse share token" },
        { status: 500 },
      );

    // STEP 2
    const shareQs = new URLSearchParams({ share: shareToken });
    if (mediaType === "tv" && season) shareQs.set("season", String(season));
    if (mediaType === "tv" && episode) shareQs.set("episode", String(episode));

    const shareRes = await fetchWithTimeout(
      `${FEBBOX_SHARE_WORKER}/?${shareQs}`,
      {},
      8000,
    );
    if (!shareRes.ok)
      return NextResponse.json(
        { success: false, error: "FebBox share worker failed" },
        { status: 502 },
      );

    const shareData = await shareRes.json();
    const files = shareData?.files ?? [];

    if (!files.length)
      return NextResponse.json(
        { success: false, error: "No files found", share: shareData },
        { status: 404 },
      );

    return NextResponse.json({ success: true, shareToken, files });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
