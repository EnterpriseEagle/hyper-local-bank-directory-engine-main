import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const suburbs = sqliteTable("suburbs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  postcode: text("postcode").notNull(),
  state: text("state").notNull(),
  stateSlug: text("state_slug").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  branchCount: integer("branch_count").notNull().default(0),
  atmCount: integer("atm_count").notNull().default(0),
  closedBranches: integer("closed_branches").notNull().default(0),
  closedAtms: integer("closed_atms").notNull().default(0),
  population: integer("population").default(0),
});

export const banks = sqliteTable("banks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull(), // "big4" | "regional" | "digital" | "credit_union"
  logoUrl: text("logo_url"),
  website: text("website"),
});

export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bankId: integer("bank_id").notNull().references(() => banks.id),
  suburbId: integer("suburb_id").notNull().references(() => suburbs.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  postcode: text("postcode").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  type: text("type").notNull(), // "branch" | "atm"
  status: text("status").notNull(), // "open" | "closed" | "limited"
  bsb: text("bsb"),
  openingHours: text("opening_hours"), // JSON string
  closedDate: text("closed_date"),
  distanceKm: real("distance_km"),
  feeRating: text("fee_rating"), // "none" | "low" | "medium" | "high"
});

export const statusReports = sqliteTable("status_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  suburbId: integer("suburb_id").notNull().references(() => suburbs.id),
  reportType: text("report_type").notNull(), // "working" | "atm_empty" | "branch_closed" | "long_queue"
  createdAt: text("created_at").notNull(),
  ipHash: text("ip_hash"), // anonymized
});

// ===== MONETIZATION TRACKING =====

export const affiliateClicks = sqliteTable("affiliate_clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  offerId: text("offer_id").notNull(), // e.g. "ing-125", "ubank-30"
  placement: text("placement").notNull(), // e.g. "homepage-card", "suburb-sticky"
  pageUrl: text("page_url"), // which page the click came from
  suburbSlug: text("suburb_slug"), // if on a suburb page
  stateSlug: text("state_slug"), // if on a state page
  referrer: text("referrer"), // external referrer (google, direct, etc)
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"), // anonymized, for deduplication
  createdAt: text("created_at").notNull(),
});

export const affiliateConversions = sqliteTable("affiliate_conversions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clickId: integer("click_id").references(() => affiliateClicks.id),
  offerId: text("offer_id").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "rejected"
  revenueEstimate: real("revenue_estimate"), // estimated $ value
  source: text("source"), // "commission_factory" | "direct" | "manual"
  externalRef: text("external_ref"), // external tracking ID from affiliate network
  createdAt: text("created_at").notNull(),
  confirmedAt: text("confirmed_at"),
});

export const weeklyDigests = sqliteTable("weekly_digests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull(), // ISO date of Monday
  weekEnd: text("week_end").notNull(), // ISO date of Sunday
  totalClicks: integer("total_clicks").notNull().default(0),
  totalConversions: integer("total_conversions").notNull().default(0),
  estimatedRevenue: real("estimated_revenue").notNull().default(0),
  topOffer: text("top_offer"), // best performing offer ID
  topPage: text("top_page"), // highest click page
  emailSentAt: text("email_sent_at"),
  reportJson: text("report_json"), // full report data as JSON
  createdAt: text("created_at").notNull(),
});

// ===== CONTROL PLANE =====

export const portfolioDomains = sqliteTable(
  "portfolio_domains",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    siteKey: text("site_key").notNull(),
    displayName: text("display_name").notNull(),
    primaryDomain: text("primary_domain"),
    domainAliasesJson: text("domain_aliases_json"),
    vertical: text("vertical").notNull(), // "finance" | "health"
    status: text("status").notNull().default("draft"), // "draft" | "live" | "planned" | "paused"
    defaultCurrency: text("default_currency").notNull().default("AUD"),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    siteKeyUnique: uniqueIndex("idx_portfolio_domains_site_key").on(table.siteKey),
    primaryDomainIdx: index("idx_portfolio_domains_primary_domain").on(table.primaryDomain),
    verticalIdx: index("idx_portfolio_domains_vertical").on(table.vertical),
  })
);

export const offerCatalog = sqliteTable(
  "offer_catalog",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    offerKey: text("offer_key").notNull(),
    legacyOfferId: text("legacy_offer_id"),
    advertiser: text("advertiser").notNull(),
    displayName: text("display_name").notNull(),
    vertical: text("vertical").notNull(), // "finance" | "health"
    status: text("status").notNull().default("draft"), // "draft" | "active" | "paused" | "retired"
    payoutModel: text("payout_model").notNull().default("cpa"),
    payoutCurrency: text("payout_currency").notNull().default("AUD"),
    defaultPayout: real("default_payout"),
    network: text("network"),
    destinationUrl: text("destination_url"),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    offerKeyUnique: uniqueIndex("idx_offer_catalog_offer_key").on(table.offerKey),
    legacyOfferIdx: index("idx_offer_catalog_legacy_offer_id").on(table.legacyOfferId),
    verticalIdx: index("idx_offer_catalog_vertical").on(table.vertical),
    statusIdx: index("idx_offer_catalog_status").on(table.status),
  })
);

export const offerRules = sqliteTable(
  "offer_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    offerId: integer("offer_id").references(() => offerCatalog.id),
    siteKey: text("site_key").notNull(),
    intentKey: text("intent_key"),
    pageType: text("page_type"),
    entitySlug: text("entity_slug"),
    stateSlug: text("state_slug"),
    countryCode: text("country_code").notNull().default("AU"),
    priority: integer("priority").notNull().default(100),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    offerIdIdx: index("idx_offer_rules_offer_id").on(table.offerId),
    siteKeyIdx: index("idx_offer_rules_site_key").on(table.siteKey),
    intentIdx: index("idx_offer_rules_intent_key").on(table.intentKey),
    statusIdx: index("idx_offer_rules_status").on(table.status),
    ruleUnique: uniqueIndex("idx_offer_rules_offer_site_intent_page").on(
      table.offerId,
      table.siteKey,
      table.intentKey,
      table.pageType
    ),
  })
);

export const affiliatePlacements = sqliteTable(
  "affiliate_placements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    placementKey: text("placement_key").notNull(),
    siteKey: text("site_key").notNull(),
    pageType: text("page_type"),
    component: text("component").notNull(),
    label: text("label").notNull(),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    placementKeyUnique: uniqueIndex("idx_affiliate_placements_key").on(table.placementKey),
    siteKeyIdx: index("idx_affiliate_placements_site_key").on(table.siteKey),
    statusIdx: index("idx_affiliate_placements_status").on(table.status),
  })
);

export const affiliateDecisions = sqliteTable(
  "affiliate_decisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    decisionKey: text("decision_key").notNull(),
    siteKey: text("site_key").notNull(),
    domain: text("domain"),
    vertical: text("vertical").notNull(),
    intentKey: text("intent_key"),
    pageType: text("page_type"),
    entitySlug: text("entity_slug"),
    placementKey: text("placement_key"),
    offerKey: text("offer_key"),
    fallbackReason: text("fallback_reason"),
    source: text("source").notNull().default("rules_engine"),
    contextJson: text("context_json"),
    decidedAt: text("decided_at").notNull(),
  },
  (table) => ({
    decisionKeyUnique: uniqueIndex("idx_affiliate_decisions_key").on(table.decisionKey),
    siteKeyIdx: index("idx_affiliate_decisions_site_key").on(table.siteKey),
    offerKeyIdx: index("idx_affiliate_decisions_offer_key").on(table.offerKey),
    decidedAtIdx: index("idx_affiliate_decisions_decided_at").on(table.decidedAt),
  })
);

export const affiliateClickEvents = sqliteTable(
  "affiliate_click_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    legacyClickId: integer("legacy_click_id").references(() => affiliateClicks.id),
    siteKey: text("site_key").notNull(),
    domain: text("domain"),
    vertical: text("vertical").notNull(),
    intentKey: text("intent_key"),
    pageType: text("page_type"),
    entitySlug: text("entity_slug"),
    suburbSlug: text("suburb_slug"),
    stateSlug: text("state_slug"),
    placementKey: text("placement_key").notNull(),
    offerKey: text("offer_key").notNull(),
    decisionKey: text("decision_key"),
    pageUrl: text("page_url"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    occurredAt: text("occurred_at").notNull(),
  },
  (table) => ({
    legacyClickIdx: index("idx_affiliate_click_events_legacy_click_id").on(table.legacyClickId),
    siteKeyIdx: index("idx_affiliate_click_events_site_key").on(table.siteKey),
    offerKeyIdx: index("idx_affiliate_click_events_offer_key").on(table.offerKey),
    occurredAtIdx: index("idx_affiliate_click_events_occurred_at").on(table.occurredAt),
  })
);

export const affiliateConversionEvents = sqliteTable(
  "affiliate_conversion_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    legacyConversionId: integer("legacy_conversion_id").references(() => affiliateConversions.id),
    legacyClickId: integer("legacy_click_id").references(() => affiliateClicks.id),
    clickEventId: integer("click_event_id").references(() => affiliateClickEvents.id),
    siteKey: text("site_key").notNull(),
    domain: text("domain"),
    vertical: text("vertical").notNull(),
    intentKey: text("intent_key"),
    pageType: text("page_type"),
    entitySlug: text("entity_slug"),
    offerKey: text("offer_key").notNull(),
    decisionKey: text("decision_key"),
    status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "rejected"
    source: text("source"),
    externalRef: text("external_ref"),
    payoutAmount: real("payout_amount"),
    payoutCurrency: text("payout_currency").notNull().default("AUD"),
    metadataJson: text("metadata_json"),
    occurredAt: text("occurred_at").notNull(),
    confirmedAt: text("confirmed_at"),
  },
  (table) => ({
    legacyConversionIdx: index("idx_affiliate_conversion_events_legacy_conversion_id").on(
      table.legacyConversionId
    ),
    siteKeyIdx: index("idx_affiliate_conversion_events_site_key").on(table.siteKey),
    offerKeyIdx: index("idx_affiliate_conversion_events_offer_key").on(table.offerKey),
    occurredAtIdx: index("idx_affiliate_conversion_events_occurred_at").on(table.occurredAt),
    externalRefIdx: index("idx_affiliate_conversion_events_external_ref").on(table.externalRef),
  })
);

export const weeklyRollups = sqliteTable(
  "weekly_rollups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    weekStart: text("week_start").notNull(),
    weekEnd: text("week_end").notNull(),
    siteKey: text("site_key").notNull(),
    vertical: text("vertical").notNull(),
    totalClicks: integer("total_clicks").notNull().default(0),
    totalConversions: integer("total_conversions").notNull().default(0),
    estimatedRevenue: real("estimated_revenue").notNull().default(0),
    confirmedRevenue: real("confirmed_revenue").notNull().default(0),
    topOfferKey: text("top_offer_key"),
    topPageUrl: text("top_page_url"),
    reportJson: text("report_json"),
    emailSentAt: text("email_sent_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    weekIdx: index("idx_weekly_rollups_week_start").on(table.weekStart),
    siteKeyIdx: index("idx_weekly_rollups_site_key").on(table.siteKey),
    siteWeekUnique: uniqueIndex("idx_weekly_rollups_site_week").on(
      table.weekStart,
      table.siteKey
    ),
  })
);

export const payoutReceipts = sqliteTable(
  "payout_receipts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    offerKey: text("offer_key").notNull(),
    siteKey: text("site_key"),
    source: text("source"),
    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("AUD"),
    periodStart: text("period_start"),
    periodEnd: text("period_end"),
    externalRef: text("external_ref"),
    notes: text("notes"),
    receivedAt: text("received_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    offerKeyIdx: index("idx_payout_receipts_offer_key").on(table.offerKey),
    siteKeyIdx: index("idx_payout_receipts_site_key").on(table.siteKey),
    receivedAtIdx: index("idx_payout_receipts_received_at").on(table.receivedAt),
    externalRefIdx: index("idx_payout_receipts_external_ref").on(table.externalRef),
  })
);

export const payoutCases = sqliteTable(
  "payout_cases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    caseKey: text("case_key").notNull(),
    offerKey: text("offer_key").notNull(),
    siteKey: text("site_key"),
    status: text("status").notNull().default("monitoring"),
    severity: text("severity").notNull().default("info"),
    outstandingAmount: real("outstanding_amount").notNull().default(0),
    currency: text("currency").notNull().default("AUD"),
    dueConversions: integer("due_conversions").notNull().default(0),
    oldestOccurredAt: text("oldest_occurred_at"),
    dueAt: text("due_at"),
    lastEscalatedAt: text("last_escalated_at"),
    emailStage: text("email_stage"),
    partnerEmail: text("partner_email"),
    emailSubject: text("email_subject"),
    emailBody: text("email_body"),
    recommendedAction: text("recommended_action"),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    resolvedAt: text("resolved_at"),
  },
  (table) => ({
    caseKeyUnique: uniqueIndex("idx_payout_cases_case_key").on(table.caseKey),
    offerKeyIdx: index("idx_payout_cases_offer_key").on(table.offerKey),
    siteKeyIdx: index("idx_payout_cases_site_key").on(table.siteKey),
    statusIdx: index("idx_payout_cases_status").on(table.status),
    severityIdx: index("idx_payout_cases_severity").on(table.severity),
  })
);

export const policyEvents = sqliteTable(
  "policy_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    siteKey: text("site_key").notNull(),
    vertical: text("vertical").notNull(),
    severity: text("severity").notNull().default("info"), // "info" | "warn" | "critical"
    eventType: text("event_type").notNull(),
    entitySlug: text("entity_slug"),
    offerKey: text("offer_key"),
    message: text("message").notNull(),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    siteKeyIdx: index("idx_policy_events_site_key").on(table.siteKey),
    severityIdx: index("idx_policy_events_severity").on(table.severity),
    createdAtIdx: index("idx_policy_events_created_at").on(table.createdAt),
  })
);
