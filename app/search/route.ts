// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

async function search(q: string) {
  const body = new URLSearchParams({
    q,
    category_general: "1",
    language: "auto",
    time_range: "",
    safesearch: "0",
    theme: "simple",
  });

  const res = await fetch("https://search.rhscz.eu/search", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "max-age=0",
      "sec-ch-ua": '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "Windows",
      origin: "null",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "sec-gpc": "1",
      "accept-language": "en-US,en;q=0.5",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
    },
    body: body.toString(),
  });

  console.log("Search status:", res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error("Search error:", text.slice(0, 200));
    throw new Error(`Search failed with status ${res.status}`);
  }

  const html = await res.text();

  // DEBUG - paste what you see in terminal
  console.log("=== HTML SNIPPET ===");
  console.log(html.slice(2000, 3500));
  console.log("=== END ===");

  const results: any[] = [];
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/g;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const article = match[1];

    const urlMatch = article.match(/href="(https?:\/\/[^"]+)"/);
    const titleMatch = article.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const descMatch = article.match(
      /<p[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/p>/,
    );

    if (urlMatch && titleMatch) {
      results.push({
        url: urlMatch[1],
        title: titleMatch[1].replace(/<[^>]+>/g, "").trim(),
        description: descMatch
          ? descMatch[1].replace(/<[^>]+>/g, "").trim()
          : "",
      });
    }
  }

  console.log("Parsed results:", results.length);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const q = body.q;

    if (!q) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await search(q);
    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
