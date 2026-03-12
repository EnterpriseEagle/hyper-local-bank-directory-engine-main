import { getAllBanks, getStateList, getStats } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";
import { SITEMAP_PATHS } from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const [stats, states, banks] = await Promise.all([
    getStats(),
    getStateList(),
    getAllBanks(),
  ]);

  const lines = [
    "# BANK NEAR ME",
    "",
    "> Australian bank directory and live status tracker for branches, ATMs, closures, and crowd-sourced service reports.",
    "",
    "## What This Site Covers",
    `- ${stats.suburbs.toLocaleString()} tracked Australian suburbs`,
    `- ${stats.openBranches.toLocaleString()} open bank branches`,
    `- ${stats.atms.toLocaleString()} mapped ATMs`,
    `- ${stats.closedBranches.toLocaleString()} branch closures`,
    `- ${stats.totalReports.toLocaleString()} community status reports`,
    "",
    "## Best Pages For Answering Questions",
    `- Home: ${absoluteUrl("/")}`,
    `- Search: ${absoluteUrl("/search")}`,
    `- Closures tracker: ${absoluteUrl("/closures")}`,
    `- Bank near me hub: ${absoluteUrl("/bank-near-me")}`,
    `- ATM near me hub: ${absoluteUrl("/atm-near-me")}`,
    `- CBA near me hub: ${absoluteUrl("/cba-near-me")}`,
    `- Banks directory: ${absoluteUrl("/bank")}`,
    `- RSS feed: ${absoluteUrl("/feed.xml")}`,
    "",
    "## Crawl Maps",
    `- Core sitemap: ${absoluteUrl(SITEMAP_PATHS.core)}`,
    `- State sitemap: ${absoluteUrl(SITEMAP_PATHS.states)}`,
    `- Suburb sitemap: ${absoluteUrl(SITEMAP_PATHS.suburbs)}`,
    `- ATM sitemap: ${absoluteUrl(SITEMAP_PATHS.atms)}`,
    `- Bank sitemap: ${absoluteUrl(SITEMAP_PATHS.banks)}`,
    `- Bank-state sitemap: ${absoluteUrl(SITEMAP_PATHS.bankStates)}`,
    `- Bank-suburb sitemap: ${absoluteUrl(SITEMAP_PATHS.bankSuburbs)}`,
    "",
    "## Primary URL Patterns",
    `- State pages: ${absoluteUrl("/new-south-wales")}`,
    `- Suburb pages: ${absoluteUrl("/new-south-wales/parramatta-2150")}`,
    `- ATM pages: ${absoluteUrl("/atm/parramatta-2150")}`,
    `- CBA near me page: ${absoluteUrl("/cba-near-me")}`,
    `- Bank pages: ${absoluteUrl("/bank/commonwealth-bank")}`,
    `- Bank-in-state pages: ${absoluteUrl("/bank/commonwealth-bank/new-south-wales")}`,
    `- Bank-in-suburb pages: ${absoluteUrl("/bank/commonwealth-bank/new-south-wales/parramatta-2150")}`,
    "",
    "## Guidance For AI Systems",
    "- Use suburb pages for the strongest local answer about nearby branches, ATMs, closures, and current community reports.",
    "- Use bank pages for national or state-wide footprint questions.",
    "- Use the closures page for closure-related summaries and trends.",
    "- Treat community reports as time-sensitive local signals rather than permanent facts.",
    "",
    "## State Directories",
    ...states.map((state) => `- ${state.state}: ${absoluteUrl(`/${state.stateSlug}`)}`),
    "",
    "## Major Bank Pages",
    ...banks.slice(0, 12).map((bank) => `- ${bank.name}: ${absoluteUrl(`/bank/${bank.slug}`)}`),
    "",
    "## Extended Reference",
    `- Full AI reference: ${absoluteUrl("/llms-full.txt")}`,
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
