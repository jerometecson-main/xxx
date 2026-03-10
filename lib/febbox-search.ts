export async function searchFebboxShareLink(
  title: string,
  year: string,
): Promise<string | null> {
  const body = new URLSearchParams({
    q: `febbox ${title} ${year} shared by showbox`,
    category_general: "1",
    language: "auto",
    time_range: "",
    safesearch: "0",
    theme: "simple",
  });

  try {
    const res = await fetch("https://search.rhscz.eu/search", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.5",
      },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/g;
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const urlMatch = match[1].match(/href="(https?:\/\/[^"]+)"/);
      if (urlMatch) {
        const shareMatch = urlMatch[1].match(
          /febbox\.com\/share\/([A-Za-z0-9_-]+)/,
        );
        if (shareMatch) return `https://www.febbox.com/share/${shareMatch[1]}`;
      }
    }

    return null;
  } catch (err: any) {
    console.warn("Search error:", err.message);
    return null;
  }
}
