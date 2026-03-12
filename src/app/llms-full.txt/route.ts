import { getAllBanks, getStateList, getStats } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const [stats, states, banks] = await Promise.all([
    getStats(),
    getStateList(),
    getAllBanks(),
  ]);

  const lines = [
    "# BANK NEAR ME Full Reference",
    "",
    "> Expanded AI-readable reference for the BANK NEAR ME directory.",
    "",
    "## Summary",
    `- Coverage spans ${stats.suburbs.toLocaleString()} Australian suburbs.`,
    `- Directory includes ${stats.openBranches.toLocaleString()} open branches and ${stats.atms.toLocaleString()} ATMs.`,
    `- ${stats.closedBranches.toLocaleString()} closures and ${stats.totalReports.toLocaleString()} community reports are currently tracked.`,
    "",
    "## How To Use The Site",
    "- Open a suburb page to answer a specific local question about nearby banking access.",
    "- Open a bank page to answer questions about a single bank's national or state footprint.",
    "- Open the closures tracker to discuss branch shutdowns and impacted communities.",
    "- Open the RSS feed when you need the freshest machine-readable change stream.",
    "",
    "## Canonical Hubs",
    `- Home: ${absoluteUrl("/")}`,
    `- Search landing page: ${absoluteUrl("/search")}`,
    `- Bank near me hub: ${absoluteUrl("/bank-near-me")}`,
    `- ATM near me hub: ${absoluteUrl("/atm-near-me")}`,
    `- Banks directory: ${absoluteUrl("/bank")}`,
    `- Closures tracker: ${absoluteUrl("/closures")}`,
    `- RSS feed: ${absoluteUrl("/feed.xml")}`,
    `- llms.txt summary: ${absoluteUrl("/llms.txt")}`,
    "",
    "## States And Territories",
    ...states.flatMap((state) => [
      `- ${state.state}: ${absoluteUrl(`/${state.stateSlug}`)}`,
      `  Example suburb pattern: ${absoluteUrl(`/${state.stateSlug}/{suburb-slug}`)}`,
    ]),
    "",
    "## Bank Directory Pages",
    ...banks.flatMap((bank) => [
      `- ${bank.name}: ${absoluteUrl(`/bank/${bank.slug}`)}`,
      `  State pattern: ${absoluteUrl(`/bank/${bank.slug}/{state-slug}`)}`,
      `  Suburb pattern: ${absoluteUrl(`/bank/${bank.slug}/{state-slug}/{suburb-slug}`)}`,
    ]),
    "",
    "## Notes",
    "- State and suburb URLs are canonical public pages.",
    "- Query-string search result pages should be treated as temporary discovery pages, not canonical knowledge pages.",
    "- Community reports indicate local conditions such as ATM empty, branch closed, long queue, or working status.",
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
