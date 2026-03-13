import {
  getBanksByAtmCoverage,
  getBanksByBranchCoverage,
  getLiveOutageStats,
  getOutageHotspots,
  getRecentClosures,
  getStats,
  getTopClosureSuburbs,
  getTopSuburbsByAtmCount,
  getTopSuburbsByBranchCount,
} from "./data";
import {
  type InsightDefinition,
  getInsightBySlug,
} from "./insight-definitions";
import { toTitleCase } from "./utils";

export interface InsightLink {
  title: string;
  href: string;
  description: string;
}

export interface InsightSection {
  title: string;
  body: string[];
  bullets?: string[];
}

export interface InsightHighlight {
  label: string;
  value: string;
  tone?: "default" | "good" | "alert";
}

export interface InsightPageData extends InsightDefinition {
  faq: Array<{ q: string; a: string }>;
  highlights: InsightHighlight[];
  sections: InsightSection[];
  relatedLinks: InsightLink[];
}
export { getAllInsights, getInsightBySlug } from "./insight-definitions";

function titleizeSuburb(name: string) {
  return toTitleCase(name);
}

export async function getInsightPageData(slug: string): Promise<InsightPageData | null> {
  const insight = getInsightBySlug(slug);

  if (!insight) {
    return null;
  }

  switch (slug) {
    case "bank-branch-closures-australia-2026": {
      const [stats, recentClosures, topSuburbs] = await Promise.all([
        getStats(),
        getRecentClosures(8),
        getTopClosureSuburbs(6),
      ]);
      const closureRate = Math.round(
        (stats.closedBranches / Math.max(1, stats.openBranches + stats.closedBranches)) * 100
      );
      const topImpact = topSuburbs[0];

      return {
        ...insight,
        highlights: [
          { label: "Closed branches tracked", value: stats.closedBranches.toLocaleString(), tone: "alert" },
          { label: "National closure rate", value: `${closureRate}%` },
          {
            label: "Most impacted suburb",
            value: topImpact
              ? `${titleizeSuburb(topImpact.name)}, ${topImpact.state}`
              : "Live closure tracking",
          },
        ],
        sections: [
          {
            title: "What the current closure map shows",
            body: [
              `BANK NEAR ME is currently tracking ${stats.closedBranches.toLocaleString()} recently closed or scheduled-for-closure branches across Australia. That gives us a much more useful operating view than a generic annual banking article, because users can move directly from the national closure picture into suburb-level alternatives.`,
              `The real value is not just the number. It is the context around which local areas are losing service, how much open branch coverage remains nearby, and whether users still have ATM access before they leave home.`,
            ],
          },
          {
            title: "Where the pressure is showing up first",
            body: [
              "The highest-impact suburbs are the places where closures matter most because local choice drops quickly once a branch disappears.",
            ],
            bullets: topSuburbs.map(
              (suburb) =>
                `${titleizeSuburb(suburb.name)}, ${suburb.state} ${suburb.postcode}: ${suburb.closedBranches} closures tracked`
            ),
          },
          {
            title: "How people should use the directory after a closure",
            body: [
              "A closure page on its own is only half the job. The stronger workflow is to open the suburb page, compare remaining branches and ATMs, then check nearby suburbs if service coverage is thin.",
              "That is exactly why the site architecture matters: closure stories feed users into transactional local pages instead of leaving them on dead-end editorial content.",
            ],
            bullets: recentClosures.map(
              (closure) =>
                `${closure.branchName} in ${titleizeSuburb(closure.suburbName)}, ${closure.state} ${closure.postcode}`
            ),
          },
        ],
        faq: [
          {
            q: "How current is this closures article?",
            a: "It is built from the same mapped closure and coverage data that powers the live closures tracker and linked suburb pages.",
          },
          {
            q: "Does this replace the closures tracker?",
            a: "No. This article explains the trend layer. The live closures tracker and suburb pages are still the best pages for active local decisions.",
          },
          {
            q: "Where should a user go after reading this?",
            a: "Open the closures tracker first, then move into the suburb page for the affected area to compare nearby branches, ATMs, and alternatives.",
          },
        ],
        relatedLinks: [
          {
            title: "Live closures tracker",
            href: "/closures",
            description: "Open the real-time closures page and move into suburb-level alternatives.",
          },
          {
            title: "Bank Near Me hub",
            href: "/bank-near-me",
            description: "Compare nearby branches and open service coverage.",
          },
          ...(topImpact
            ? [
                {
                  title: `Most impacted suburb: ${titleizeSuburb(topImpact.name)}`,
                  href: `/${topImpact.stateSlug}/${topImpact.slug}`,
                  description: "Jump straight into a closure hotspot and check remaining access.",
                },
              ]
            : []),
        ],
      };
    }

    case "fee-free-atm-guide-australia": {
      const [stats, topBanks, topSuburbs] = await Promise.all([
        getStats(),
        getBanksByAtmCoverage(6),
        getTopSuburbsByAtmCount(6),
      ]);
      const biggestNetwork = topBanks[0];
      const topSuburb = topSuburbs[0];

      return {
        ...insight,
        highlights: [
          { label: "Mapped ATMs", value: stats.atms.toLocaleString(), tone: "good" },
          {
            label: "Largest ATM network",
            value: biggestNetwork ? biggestNetwork.bankName : "National coverage",
          },
          {
            label: "ATM-heavy suburb",
            value: topSuburb
              ? `${titleizeSuburb(topSuburb.name)}, ${topSuburb.state}`
              : "Suburb-by-suburb search",
          },
        ],
        sections: [
          {
            title: "Start with the biggest ATM networks",
            body: [
              "If the goal is fast cash access, network breadth matters more than generic banking advice. The strongest starting point is a bank with large ATM coverage and then a suburb page that confirms local density.",
            ],
            bullets: topBanks.map(
              (bank) =>
                `${bank.bankName}: ${bank.atmCount} ATMs across ${bank.suburbCount} tracked suburbs`
            ),
          },
          {
            title: "Use suburb ATM pages, not generic locator pages",
            body: [
              "The advantage of the suburb ATM pages is context. They show local ATM counts, nearby branch alternatives, and related bank pages in one place.",
              "That is much stronger than a dead-simple locator because it helps users recover when the first ATM is empty, offline, or inside a branch foyer.",
            ],
            bullets: topSuburbs.map(
              (suburb) =>
                `${titleizeSuburb(suburb.name)}, ${suburb.state} ${suburb.postcode}: ${suburb.atmCount} ATMs and ${suburb.branchCount} branches`
            ),
          },
          {
            title: "What fee-free really means in practice",
            body: [
              "For most users, the practical move is to start with major bank ATMs, then compare alternatives nearby instead of assuming the first machine will work.",
              "The best user experience is search, open the suburb ATM page, check the local bank mix, and then use the linked branch or suburb pages if something looks thin.",
            ],
          },
        ],
        faq: [
          {
            q: "What is the best page on the site for ATM access?",
            a: "Use the ATM Near Me hub for discovery, then move into the suburb ATM page for the actual local answer.",
          },
          {
            q: "Why not just search for a single ATM brand?",
            a: "Because local ATM availability is what matters. The suburb pages help users compare multiple providers and nearby branch alternatives in one place.",
          },
          {
            q: "How should this article support the directory?",
            a: "It should funnel users into suburb ATM pages and bank pages rather than trying to replace them.",
          },
        ],
        relatedLinks: [
          {
            title: "ATM Near Me hub",
            href: "/atm-near-me",
            description: "Search the national ATM coverage hub.",
          },
          {
            title: "Search suburbs and postcodes",
            href: "/search",
            description: "Jump into a local suburb or postcode page fast.",
          },
          ...(topSuburb
            ? [
                {
                  title: `ATM page for ${titleizeSuburb(topSuburb.name)}`,
                  href: `/atm/${topSuburb.slug}`,
                  description: "See one of the strongest local ATM pages on the site.",
                },
              ]
            : []),
        ],
      };
    }

    case "find-a-working-bank-near-you-australia": {
      const [stats, outageStats, hotspots] = await Promise.all([
        getStats(),
        getLiveOutageStats(),
        getOutageHotspots(6),
      ]);
      const nonWorkingSignals =
        outageStats.atmEmpty +
        outageStats.branchClosed +
        outageStats.closureNotice +
        outageStats.longQueue;
      const hotspot = hotspots[0];

      return {
        ...insight,
        highlights: [
          { label: "Community reports", value: stats.totalReports.toLocaleString(), tone: "good" },
          { label: "Non-working signals", value: nonWorkingSignals.toLocaleString(), tone: "alert" },
          {
            label: "Current hotspot",
            value: hotspot
              ? `${titleizeSuburb(hotspot.suburbName)}, ${hotspot.state}`
              : "Local live checks",
          },
        ],
        sections: [
          {
            title: "A bank near you is not enough if it is not working",
            body: [
              "This is the core search intent behind the whole site. Users are not just asking where a branch or ATM is. They are asking whether it is worth the trip right now.",
              `That is why the directory combines branch coverage, ATM coverage, closures, and ${stats.totalReports.toLocaleString()} community reports into the same navigation path.`,
            ],
          },
          {
            title: "Check the local risk signals before you leave",
            body: [
              "The strongest pre-trip signals are ATM empty reports, closure notices, branch closed reports, long queue reports, and nearby alternatives in the same suburb or next suburb over.",
            ],
            bullets: [
              `${outageStats.atmEmpty.toLocaleString()} ATM empty reports tracked`,
              `${outageStats.closureNotice.toLocaleString()} closure notice reports tracked`,
              `${outageStats.branchClosed.toLocaleString()} branch closed reports tracked`,
              `${outageStats.longQueue.toLocaleString()} long queue reports tracked`,
              `${outageStats.working.toLocaleString()} working-status confirmations tracked`,
            ],
          },
          {
            title: "Where recent problems are clustering",
            body: [
              "Hotspots matter because they show where users should slow down and check local detail instead of trusting the first result.",
            ],
            bullets: hotspots.map(
              (hotspotItem) =>
                `${titleizeSuburb(hotspotItem.suburbName)}, ${hotspotItem.state} ${hotspotItem.postcode}: ${hotspotItem.reportCount} non-working reports`
            ),
          },
        ],
        faq: [
          {
            q: "What is the best first page for this search intent?",
            a: "The Bank Near Me hub is the best discovery page, but the suburb page is the strongest final answer.",
          },
          {
            q: "Should users trust community reports alone?",
            a: "They should treat reports as fresh local signals and cross-check them with branch, ATM, and closure coverage on the same suburb page.",
          },
          {
            q: "Where do AI search systems get the best answer?",
            a: "From the suburb pages, bank pages, and closure pages together rather than from a thin search result page.",
          },
        ],
        relatedLinks: [
          {
            title: "Bank Near Me hub",
            href: "/bank-near-me",
            description: "Start with the main discovery page for nearby banking access.",
          },
          {
            title: "Search suburbs and postcodes",
            href: "/search",
            description: "Jump directly into a suburb page.",
          },
          ...(hotspot
            ? [
                {
                  title: `Current hotspot: ${titleizeSuburb(hotspot.suburbName)}`,
                  href: `/${hotspot.stateSlug}/${hotspot.suburbSlug}`,
                  description: "See a live suburb page with elevated issue reporting.",
                },
              ]
            : []),
        ],
      };
    }

    case "best-bank-networks-in-australia": {
      const [stats, topBanks, topSuburbs] = await Promise.all([
        getStats(),
        getBanksByBranchCoverage(8),
        getTopSuburbsByBranchCount(6),
      ]);
      const largestBank = topBanks[0];

      return {
        ...insight,
        highlights: [
          { label: "Open branches tracked", value: stats.openBranches.toLocaleString(), tone: "good" },
          {
            label: "Largest branch network",
            value: largestBank ? largestBank.bankName : "National coverage data",
          },
          {
            label: "Top branch suburb",
            value: topSuburbs[0]
              ? `${titleizeSuburb(topSuburbs[0].name)}, ${topSuburbs[0].state}`
              : "Suburb-by-suburb discovery",
          },
        ],
        sections: [
          {
            title: "Which banks show the broadest branch reach",
            body: [
              "The banks with the best physical coverage tend to be the ones that keep showing up across state pages, suburb pages, and ATM pages. That matters because people searching bank-near-me terms care about practical network density, not brand theory.",
            ],
            bullets: topBanks.map(
              (bank) =>
                `${bank.bankName}: ${bank.branchCount} branches and ${bank.atmCount} ATMs across ${bank.suburbCount} suburbs`
            ),
          },
          {
            title: "Why suburb density matters more than national scale alone",
            body: [
              "A national network can still feel thin in a specific area. The better answer is to pair the national bank page with suburb pages that show whether the network is actually dense enough where the user lives or works.",
            ],
            bullets: topSuburbs.map(
              (suburb) =>
                `${titleizeSuburb(suburb.name)}, ${suburb.state} ${suburb.postcode}: ${suburb.branchCount} branches and ${suburb.atmCount} ATMs`
            ),
          },
          {
            title: "How this article should support ranking",
            body: [
              "This piece should rank for comparison and research intent, then push users into the bank directory, individual bank pages, and state-specific bank pages where the transactional location detail lives.",
            ],
          },
        ],
        faq: [
          {
            q: "Does this article replace the bank directory?",
            a: "No. It helps users compare networks, then move into the directory and bank pages for actual location detail.",
          },
          {
            q: "What is the best next click after reading this?",
            a: "Either the full bank directory or the national page for the specific bank the user cares about.",
          },
          {
            q: "Why is network breadth important for SEO and users?",
            a: "Because users searching near-me terms are really asking which bank is most likely to have a practical, reachable option nearby.",
          },
        ],
        relatedLinks: [
          {
            title: "Banks directory",
            href: "/bank",
            description: "Browse all tracked bank brands in one directory.",
          },
          {
            title: "Bank Near Me hub",
            href: "/bank-near-me",
            description: "Move from network research into local branch discovery.",
          },
          ...(largestBank
            ? [
                {
                  title: `${largestBank.bankName} national page`,
                  href: `/bank/${largestBank.bankSlug}`,
                  description: "Open the biggest network page directly.",
                },
              ]
            : []),
        ],
      };
    }

    case "regional-banking-access-australia": {
      const [stats, topSuburbs, recentClosures, outageHotspots] = await Promise.all([
        getStats(),
        getTopClosureSuburbs(6),
        getRecentClosures(6),
        getOutageHotspots(4),
      ]);
      const pressurePoint = topSuburbs[0];

      return {
        ...insight,
        highlights: [
          { label: "Closed branches tracked", value: stats.closedBranches.toLocaleString(), tone: "alert" },
          { label: "Open branches remaining", value: stats.openBranches.toLocaleString(), tone: "good" },
          {
            label: "Regional pressure point",
            value: pressurePoint
              ? `${titleizeSuburb(pressurePoint.name)}, ${pressurePoint.state}`
              : "Live suburb coverage",
          },
        ],
        sections: [
          {
            title: "Regional banking access breaks when one location disappears",
            body: [
              "In regional and outer-suburban areas, a closure is not just another news item. It can turn a short errand into a long drive, especially when branch density and ATM density are already thin.",
              "That is why the right search experience is closure data plus nearby alternatives, not a generic blog post about digital banking trends.",
            ],
          },
          {
            title: "What to check before making the trip",
            body: [
              "Regional users should check three things in order: whether the branch is still open, whether there is local ATM backup, and which nearby suburbs still have live banking access.",
            ],
            bullets: [
              ...topSuburbs.map(
                (suburb) =>
                  `${titleizeSuburb(suburb.name)}, ${suburb.state}: ${suburb.closedBranches} closures tracked`
              ),
              ...outageHotspots.map(
                (hotspot) =>
                  `${titleizeSuburb(hotspot.suburbName)}, ${hotspot.state}: ${hotspot.reportCount} local issue reports`
              ),
            ],
          },
          {
            title: "How the site should answer this need",
            body: [
              "The editorial page builds trust and context. The suburb page does the actual job. That is the right split for both users and SEO.",
            ],
            bullets: recentClosures.map(
              (closure) =>
                `${closure.branchName} -> check ${titleizeSuburb(closure.suburbName)}, ${closure.state} for remaining access`
            ),
          },
        ],
        faq: [
          {
            q: "Is this article only for rural users?",
            a: "No. It is strongest for regional and outer-suburban access questions, but the workflow applies anywhere branch density is thin.",
          },
          {
            q: "What page should a regional user open next?",
            a: "The suburb page for the affected location, followed by nearby suburb pages if coverage is limited.",
          },
          {
            q: "Why does this matter for the site’s SEO?",
            a: "Because it supports real user problems around closures and access, then pushes them into the most useful local pages on the site.",
          },
        ],
        relatedLinks: [
          {
            title: "Closures tracker",
            href: "/closures",
            description: "Start with the national closure view.",
          },
          {
            title: "Search suburbs and postcodes",
            href: "/search",
            description: "Jump into the exact local area you need.",
          },
          ...(pressurePoint
            ? [
                {
                  title: `Pressure point: ${titleizeSuburb(pressurePoint.name)}`,
                  href: `/${pressurePoint.stateSlug}/${pressurePoint.slug}`,
                  description: "Open a closure-heavy suburb page directly.",
                },
              ]
            : []),
        ],
      };
    }

    default:
      return null;
  }
}
