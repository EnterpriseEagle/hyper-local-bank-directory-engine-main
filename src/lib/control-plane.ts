import { AFFILIATE_OFFERS } from "./affiliate-offers";

export const CONTROL_PLANE_SITE_KEYS = [
  "bank_near_me",
  "atm_near_me",
  "cba_near_me",
  "help_with_home_loan",
  "bulk_bill_near_me",
] as const;

export const CONTROL_PLANE_VERTICALS = ["finance", "health"] as const;

export const CONTROL_PLANE_DOMAIN_STATUSES = [
  "draft",
  "live",
  "planned",
  "paused",
] as const;

export const CONTROL_PLANE_OFFER_STATUSES = [
  "draft",
  "active",
  "paused",
  "retired",
] as const;

export type ControlPlaneSiteKey = (typeof CONTROL_PLANE_SITE_KEYS)[number];
export type ControlPlaneVertical = (typeof CONTROL_PLANE_VERTICALS)[number];
export type ControlPlaneDomainStatus = (typeof CONTROL_PLANE_DOMAIN_STATUSES)[number];
export type ControlPlaneOfferStatus = (typeof CONTROL_PLANE_OFFER_STATUSES)[number];

export interface PortfolioDomainSeed {
  siteKey: ControlPlaneSiteKey;
  displayName: string;
  primaryDomain: string | null;
  domainAliases: string[];
  vertical: ControlPlaneVertical;
  status: ControlPlaneDomainStatus;
  notes?: string;
}

export interface OfferCatalogSeed {
  offerKey: string;
  legacyOfferId: string | null;
  advertiser: string;
  displayName: string;
  vertical: ControlPlaneVertical;
  status: ControlPlaneOfferStatus;
  payoutModel: string;
  payoutCurrency: string;
  defaultPayout: number | null;
  network: string | null;
  destinationUrl: string;
  metadata: Record<string, unknown>;
}

export interface PlacementSeed {
  placementKey: string;
  siteKey: ControlPlaneSiteKey;
  pageType: string;
  component: string;
  label: string;
  status: "active" | "paused";
  notes?: string;
}

export interface OfferRuleSeed {
  offerKey: string;
  siteKey: ControlPlaneSiteKey;
  intentKey: string;
  pageType: string;
  priority: number;
  status: "active" | "paused";
  notes?: string;
}

export interface TrackingContextInput {
  pageUrl?: string | null;
  host?: string | null;
  siteKey?: string | null;
  domain?: string | null;
  pageType?: string | null;
  intentKey?: string | null;
  entitySlug?: string | null;
  suburbSlug?: string | null;
  stateSlug?: string | null;
}

export interface TrackingContext {
  siteKey: ControlPlaneSiteKey;
  domain: string | null;
  vertical: ControlPlaneVertical;
  pageType: string;
  intentKey: string;
  entitySlug: string | null;
  suburbSlug: string | null;
  stateSlug: string | null;
}

export const PORTFOLIO_DOMAIN_SEEDS: PortfolioDomainSeed[] = [
  {
    siteKey: "bank_near_me",
    displayName: "Bank Near Me",
    primaryDomain: "banknearme.com.au",
    domainAliases: ["www.banknearme.com.au"],
    vertical: "finance",
    status: "live",
    notes: "Primary publishing property for local banking intent.",
  },
  {
    siteKey: "atm_near_me",
    displayName: "ATM Near Me",
    primaryDomain: null,
    domainAliases: [],
    vertical: "finance",
    status: "planned",
    notes: "Reserved for ATM and cash-access intent capture.",
  },
  {
    siteKey: "cba_near_me",
    displayName: "CBA Near Me",
    primaryDomain: null,
    domainAliases: [],
    vertical: "finance",
    status: "planned",
    notes: "Reserved for Commonwealth Bank exact-match capture.",
  },
  {
    siteKey: "help_with_home_loan",
    displayName: "Help With Home Loan",
    primaryDomain: "helpwithhomeloan.com.au",
    domainAliases: ["www.helpwithhomeloan.com.au", "helpwithhomeloan.com"],
    vertical: "finance",
    status: "planned",
    notes: "Mortgage and refinancing lead-gen property for higher-value finance intent.",
  },
  {
    siteKey: "bulk_bill_near_me",
    displayName: "Bulk Bill Near Me",
    primaryDomain: null,
    domainAliases: [],
    vertical: "health",
    status: "planned",
    notes: "Separate healthcare vertical sharing the same reporting control plane.",
  },
];

export const PLACEMENT_SEEDS: PlacementSeed[] = [
  {
    placementKey: "homepage-card",
    siteKey: "bank_near_me",
    pageType: "home",
    component: "SwitchOfferCard",
    label: "Homepage hero offer",
    status: "active",
  },
  {
    placementKey: "suburb-sticky",
    siteKey: "bank_near_me",
    pageType: "suburb",
    component: "SwitchStickyBar",
    label: "Suburb sticky CTA",
    status: "active",
  },
  {
    placementKey: "inline-branch-list",
    siteKey: "bank_near_me",
    pageType: "suburb",
    component: "InlineOfferCard",
    label: "Inline branch list card",
    status: "active",
  },
];

export const OFFER_CATALOG_SEEDS: OfferCatalogSeed[] = AFFILIATE_OFFERS.map((offer) => ({
  offerKey: offer.id,
  legacyOfferId: offer.id,
  advertiser: offer.brand,
  displayName: `${offer.brand} - ${offer.tagline}`,
  vertical: "finance",
  status: offer.active ? "active" : "paused",
  payoutModel: offer.id.includes("amex") ? "cpa" : "hybrid",
  payoutCurrency: "AUD",
  defaultPayout: offer.id === "amex-platinum" ? 100 : offer.id === "ing-125" ? 35 : 15,
  network: "direct",
  destinationUrl: offer.url,
  metadata: {
    badge: offer.badge,
    cta: offer.cta,
    finePrint: offer.finePrint,
    stats: offer.stats,
  },
}));

export const OFFER_RULE_SEEDS: OfferRuleSeed[] = [
  {
    offerKey: "ubank-30",
    siteKey: "bank_near_me",
    intentKey: "bank-discovery",
    pageType: "hub",
    priority: 100,
    status: "active",
    notes: "Baseline switch offer for broad banking discovery intent.",
  },
  {
    offerKey: "ubank-30",
    siteKey: "atm_near_me",
    intentKey: "atm-alternative",
    pageType: "hub",
    priority: 100,
    status: "active",
    notes: "Fallback offer when ATM visitors need a better everyday banking option.",
  },
  {
    offerKey: "ubank-30",
    siteKey: "cba_near_me",
    intentKey: "brand-switch",
    pageType: "brand-hub",
    priority: 100,
    status: "active",
    notes: "Generic alternative while brand-specific finance offers are not yet approved.",
  },
  {
    offerKey: "ing-125",
    siteKey: "bank_near_me",
    intentKey: "switch-bonus",
    pageType: "hub",
    priority: 50,
    status: "paused",
    notes: "Higher-priority campaign when the ING offer is live.",
  },
];

export const PORTFOLIO_BRAND_NAME = "Near Me Network";

export function isControlPlaneSiteKey(value: string | null | undefined): value is ControlPlaneSiteKey {
  if (!value) {
    return false;
  }

  return CONTROL_PLANE_SITE_KEYS.includes(value as ControlPlaneSiteKey);
}

export function coerceSiteKey(value: string | null | undefined): ControlPlaneSiteKey | null {
  return isControlPlaneSiteKey(value) ? value : null;
}

export function getPortfolioDomainSeed(
  siteKey: ControlPlaneSiteKey
): PortfolioDomainSeed | undefined {
  return PORTFOLIO_DOMAIN_SEEDS.find((domain) => domain.siteKey === siteKey);
}

export function getOfferSeed(offerKey: string): OfferCatalogSeed | undefined {
  return OFFER_CATALOG_SEEDS.find((offer) => offer.offerKey === offerKey);
}

export function getVerticalForSite(siteKey: ControlPlaneSiteKey): ControlPlaneVertical {
  return getPortfolioDomainSeed(siteKey)?.vertical ?? "finance";
}

export function resolveSiteKeyFromHost(host?: string | null): ControlPlaneSiteKey | null {
  if (!host) {
    return null;
  }

  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return null;
  }

  const matched = PORTFOLIO_DOMAIN_SEEDS.find((domain) => {
    if (domain.primaryDomain === normalizedHost) {
      return true;
    }

    return domain.domainAliases.some((alias) => alias.toLowerCase() === normalizedHost);
  });

  return matched?.siteKey ?? null;
}

export function normalizePathname(pageUrl?: string | null): string {
  if (!pageUrl) {
    return "/";
  }

  try {
    if (pageUrl.startsWith("http://") || pageUrl.startsWith("https://")) {
      return new URL(pageUrl).pathname || "/";
    }
  } catch {
    return "/";
  }

  return pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;
}

export function inferSiteKeyFromPath(
  pageUrl?: string | null,
  host?: string | null
): ControlPlaneSiteKey {
  const pathname = normalizePathname(pageUrl);

  if (pathname.startsWith("/atm-near-me")) {
    return "atm_near_me";
  }

  if (pathname.startsWith("/cba-near-me")) {
    return "cba_near_me";
  }

  if (pathname.startsWith("/bulk-bill-near-me")) {
    return "bulk_bill_near_me";
  }

  if (pathname.startsWith("/help-with-home-loan")) {
    return "help_with_home_loan";
  }

  return resolveSiteKeyFromHost(host) ?? "bank_near_me";
}

export function inferPageTypeFromContext(input: {
  pageUrl?: string | null;
  suburbSlug?: string | null;
  pageType?: string | null;
  siteKey?: ControlPlaneSiteKey | null;
}): string {
  if (input.pageType) {
    return input.pageType;
  }

  if (input.suburbSlug) {
    return "suburb";
  }

  const pathname = normalizePathname(input.pageUrl);

  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/bank-near-me" || pathname === "/atm-near-me") {
    return "hub";
  }

  if (pathname === "/cba-near-me") {
    return "brand-hub";
  }

  if (/^\/[a-z-]+\/[a-z0-9-]+$/.test(pathname)) {
    return "location";
  }

  if (pathname.split("/").filter(Boolean).length === 1) {
    return "landing";
  }

  return input.siteKey === "bulk_bill_near_me" ? "health-hub" : "content";
}

export function inferIntentKey(input: {
  siteKey: ControlPlaneSiteKey;
  pageUrl?: string | null;
  pageType?: string | null;
  suburbSlug?: string | null;
  entitySlug?: string | null;
}): string {
  if (input.entitySlug === "commonwealth-bank") {
    return "brand-switch";
  }

  if (input.suburbSlug) {
    return "local-discovery";
  }

  const pathname = normalizePathname(input.pageUrl);

  if (pathname.startsWith("/atm-near-me")) {
    return "atm-alternative";
  }

  if (pathname.startsWith("/cba-near-me")) {
    return "brand-switch";
  }

  if (input.siteKey === "bulk_bill_near_me") {
    return "provider-discovery";
  }

  if (input.pageType === "home") {
    return "bank-discovery";
  }

  return "general-discovery";
}

export function buildTrackingContext(input: TrackingContextInput): TrackingContext {
  const siteKey = coerceSiteKey(input.siteKey) ?? inferSiteKeyFromPath(input.pageUrl, input.host);
  const pageType = inferPageTypeFromContext({
    pageUrl: input.pageUrl,
    suburbSlug: input.suburbSlug,
    pageType: input.pageType,
    siteKey,
  });
  const entitySlug =
    input.entitySlug ??
    (siteKey === "cba_near_me" ? "commonwealth-bank" : null);

  return {
    siteKey,
    domain: input.domain ?? normalizeHost(input.host),
    vertical: getVerticalForSite(siteKey),
    pageType,
    intentKey:
      input.intentKey ??
      inferIntentKey({
        siteKey,
        pageUrl: input.pageUrl,
        pageType,
        suburbSlug: input.suburbSlug,
        entitySlug,
      }),
    entitySlug,
    suburbSlug: input.suburbSlug ?? null,
    stateSlug: input.stateSlug ?? null,
  };
}

export function normalizeHost(host?: string | null): string | null {
  if (!host) {
    return null;
  }

  return host
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();
}

export function createDecisionKey(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}
