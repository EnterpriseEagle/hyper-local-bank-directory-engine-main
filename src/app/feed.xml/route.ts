import { getRecentClosures, getRecentReportsGlobal } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";
import { toTitleCase } from "@/lib/utils";

export const revalidate = 300;

const REPORT_LABELS: Record<string, string> = {
  working: "Working",
  atm_empty: "ATM empty",
  branch_closed: "Branch closed",
  long_queue: "Long queue",
};

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
  const [closures, reports] = await Promise.all([
    getRecentClosures(20),
    getRecentReportsGlobal(20),
  ]);

  const items = [
    ...closures.map((closure) => ({
      title: `${closure.branchName} closure in ${toTitleCase(closure.suburbName)}`,
      link: absoluteUrl(`/${closure.stateSlug}/${closure.suburbSlug}`),
      guid: `closure-${closure.stateSlug}-${closure.suburbSlug}-${closure.branchName}`,
      pubDate: toPubDate(closure.closedDate),
      description: `${closure.branchName} is listed as closed in ${toTitleCase(closure.suburbName)}, ${closure.state} ${closure.postcode}. View nearby alternatives and current banking coverage.`,
      sortValue: closure.closedDate || "",
    })),
    ...reports.map((report) => ({
      title: `${REPORT_LABELS[report.reportType] || report.reportType}: ${report.branchName}`,
      link: absoluteUrl(`/${report.stateSlug}/${report.suburbSlug}`),
      guid: `report-${report.id}`,
      pubDate: toPubDate(report.createdAt),
      description: `${REPORT_LABELS[report.reportType] || report.reportType} report for ${report.branchName} in ${toTitleCase(report.suburbName)}, ${report.state} ${report.postcode}.`,
      sortValue: report.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.sortValue).getTime() - new Date(a.sortValue).getTime())
    .slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BANK NEAR ME Live Updates</title>
    <link>${absoluteUrl("/")}</link>
    <description>Recent branch closures and live bank status reports across Australia.</description>
    <language>en-au</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
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
