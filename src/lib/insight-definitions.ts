export interface InsightDefinition {
  slug: string;
  category: string;
  kicker: string;
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
  readingMinutes: number;
  publishedTime: string;
  modifiedTime: string;
}

const PUBLISHED_TODAY = "2026-03-13T00:00:00.000Z";
const UPDATED_TODAY = "2026-03-13T10:00:00.000Z";

const INSIGHTS: InsightDefinition[] = [
  {
    slug: "bank-branch-closures-australia-2026",
    category: "Closures",
    kicker: "Closure Intelligence",
    title: "Bank Branch Closures Australia 2026: What the Data Is Showing",
    description:
      "A data-backed look at Australian bank branch closures, the suburbs taking the hit, and how people can find nearby alternatives faster.",
    excerpt:
      "This is the live closure context piece behind the tracker, using suburb-level closure and coverage data instead of generic finance commentary.",
    keywords: [
      "bank branch closures Australia 2026",
      "Australian bank closure report",
      "bank closures by suburb Australia",
      "regional bank closures Australia",
    ],
    readingMinutes: 6,
    publishedTime: PUBLISHED_TODAY,
    modifiedTime: UPDATED_TODAY,
  },
  {
    slug: "fee-free-atm-guide-australia",
    category: "ATM Access",
    kicker: "ATM Strategy",
    title: "Fee-Free ATM Guide Australia: How To Find Better Cash Access Fast",
    description:
      "A practical guide to finding major bank ATMs, avoiding dead trips, and using suburb-level ATM coverage pages across Australia.",
    excerpt:
      "Built for users searching ATM access in the moment, with network coverage context and local page paths instead of generic banking advice.",
    keywords: [
      "fee free ATM Australia",
      "ATM near me Australia guide",
      "major bank ATM finder Australia",
      "cash withdrawal near me Australia",
    ],
    readingMinutes: 5,
    publishedTime: PUBLISHED_TODAY,
    modifiedTime: UPDATED_TODAY,
  },
  {
    slug: "find-a-working-bank-near-you-australia",
    category: "Bank Near Me",
    kicker: "Service Status",
    title: "How To Find a Working Bank Near You in Australia",
    description:
      "A live-status guide to finding a working branch or ATM near you using suburb pages, closures data, and recent community reports.",
    excerpt:
      "This supports the exact high-intent searches behind the site: not just where a bank is, but whether it is actually working before the trip.",
    keywords: [
      "working bank near me Australia",
      "open bank near me Australia",
      "bank near me live status",
      "how to find a bank near me",
    ],
    readingMinutes: 5,
    publishedTime: PUBLISHED_TODAY,
    modifiedTime: UPDATED_TODAY,
  },
  {
    slug: "best-bank-networks-in-australia",
    category: "Bank Coverage",
    kicker: "Network Comparison",
    title: "Best Bank Networks in Australia: Which Banks Have the Broadest Coverage?",
    description:
      "A directory-backed comparison of the biggest branch and ATM networks in Australia, with links into state and suburb pages.",
    excerpt:
      "Instead of opinion content, this article uses branch and ATM coverage data to show which bank networks are likely to feel strongest on the ground.",
    keywords: [
      "best bank networks Australia",
      "largest bank branch networks Australia",
      "bank branches Australia comparison",
      "best ATM networks Australia",
    ],
    readingMinutes: 6,
    publishedTime: PUBLISHED_TODAY,
    modifiedTime: UPDATED_TODAY,
  },
  {
    slug: "regional-banking-access-australia",
    category: "Regional Access",
    kicker: "Regional Banking",
    title: "Regional Banking Access in Australia: What To Check Before You Drive",
    description:
      "A practical guide for regional users dealing with branch closures, limited ATM coverage, and longer distances between banking options.",
    excerpt:
      "This article turns your closure and suburb coverage data into a decision guide for users outside the metro core.",
    keywords: [
      "regional banking access Australia",
      "bank closure regional Australia",
      "regional ATM access Australia",
      "branch closures rural Australia",
    ],
    readingMinutes: 5,
    publishedTime: PUBLISHED_TODAY,
    modifiedTime: UPDATED_TODAY,
  },
];

export function getAllInsights() {
  return INSIGHTS;
}

export function getInsightBySlug(slug: string) {
  return INSIGHTS.find((insight) => insight.slug === slug) ?? null;
}
