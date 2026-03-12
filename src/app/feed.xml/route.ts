import { getUnifiedFeedEntries } from "@/lib/feed";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toPubDate(value?: string | null) {
  if (!value) {
    return new Date().toUTCString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toUTCString()
    : parsed.toUTCString();
}

export async function GET() {
  const items = await getUnifiedFeedEntries(30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BANK NEAR ME Live Updates</title>
    <link>${absoluteUrl("/")}</link>
    <description>Recent branch closures, live bank status reports, and editorial banking insights across Australia.</description>
    <language>en-au</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid>${escapeXml(item.id)}</guid>
      <pubDate>${toPubDate(item.publishedAt)}</pubDate>
      <category>${escapeXml(item.category)}</category>
      <description>${escapeXml(item.summary)}</description>
    </item>`
      )
      .join("\n    ")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
