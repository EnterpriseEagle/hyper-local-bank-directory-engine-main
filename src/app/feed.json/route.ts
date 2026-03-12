import { getUnifiedFeedEntries } from "@/lib/feed";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export async function GET() {
  const items = await getUnifiedFeedEntries(30);

  const payload = {
    version: "https://jsonfeed.org/version/1.1",
    title: "BANK NEAR ME Live Updates",
    home_page_url: absoluteUrl("/"),
    feed_url: absoluteUrl("/feed.json"),
    description:
      "Recent branch closures, live bank status reports, and editorial banking insights across Australia.",
    language: "en-AU",
    items: items.map((item) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      summary: item.summary,
      content_text: item.summary,
      date_published: item.publishedAt,
      date_modified: item.publishedAt,
      tags: [item.category],
    })),
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
