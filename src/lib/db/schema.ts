import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

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
