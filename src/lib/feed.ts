import { getRecentClosures, getRecentReportsGlobal } from "./data";
import { getAllInsights } from "./insight-definitions";
import { absoluteUrl } from "./seo";
import { toTitleCase } from "./utils";

export interface FeedEntry {
  id: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  category: string;
}

const REPORT_LABELS: Record<string, string> = {
  working: "Working",
  atm_empty: "ATM empty",
  branch_closed: "Branch closed",
  long_queue: "Long queue",
};

export async function getUnifiedFeedEntries(limit = 30): Promise<FeedEntry[]> {
  const [closures, reports] = await Promise.all([
    getRecentClosures(limit),
    getRecentReportsGlobal(limit),
  ]);

  const insightEntries = getAllInsights().map((insight) => ({
    id: `insight-${insight.slug}`,
    title: insight.title,
    url: absoluteUrl(`/insights/${insight.slug}`),
    summary: insight.excerpt,
    publishedAt: insight.modifiedTime || insight.publishedTime,
    category: `Insight: ${insight.category}`,
  }));

  const closureEntries = closures.map((closure) => ({
    id: `closure-${closure.stateSlug}-${closure.suburbSlug}-${closure.branchName}`,
    title: `${closure.branchName} closure in ${toTitleCase(closure.suburbName)}`,
    url: absoluteUrl(`/${closure.stateSlug}/${closure.suburbSlug}`),
    summary: `${closure.branchName} is listed as closed in ${toTitleCase(closure.suburbName)}, ${closure.state} ${closure.postcode}. View nearby alternatives and current banking coverage.`,
    publishedAt: closure.closedDate || new Date().toISOString(),
    category: "Closure",
  }));

  const reportEntries = reports.map((report) => ({
    id: `report-${report.id}`,
    title: `${REPORT_LABELS[report.reportType] || report.reportType}: ${report.branchName}`,
    url: absoluteUrl(`/${report.stateSlug}/${report.suburbSlug}`),
    summary: `${REPORT_LABELS[report.reportType] || report.reportType} report for ${report.branchName} in ${toTitleCase(report.suburbName)}, ${report.state} ${report.postcode}.`,
    publishedAt: report.createdAt,
    category: "Live report",
  }));

  return [...insightEntries, ...closureEntries, ...reportEntries]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}
