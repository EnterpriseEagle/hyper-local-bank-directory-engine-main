/**
 * Run this once to create the multi-domain affiliate control-plane tables.
 * Usage: bun src/lib/db/migrate-control-plane.ts
 */
import { createClient } from "@libsql/client";
import {
  OFFER_CATALOG_SEEDS,
  OFFER_RULE_SEEDS,
  PLACEMENT_SEEDS,
  PORTFOLIO_DOMAIN_SEEDS,
} from "../control-plane";

const databaseUrl = process.env.DATABASE_URL?.trim() || "file:./data/banknearme.db";
const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

const client = createClient({
  url: databaseUrl,
  ...(authToken ? { authToken } : {}),
});

async function migrate() {
  console.log("Creating control-plane tables...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_key TEXT NOT NULL,
      display_name TEXT NOT NULL,
      primary_domain TEXT,
      domain_aliases_json TEXT,
      vertical TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      default_currency TEXT NOT NULL DEFAULT 'AUD',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_domains_site_key
    ON portfolio_domains(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_portfolio_domains_primary_domain
    ON portfolio_domains(primary_domain)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_portfolio_domains_vertical
    ON portfolio_domains(vertical)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS offer_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_key TEXT NOT NULL,
      legacy_offer_id TEXT,
      advertiser TEXT NOT NULL,
      display_name TEXT NOT NULL,
      vertical TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      payout_model TEXT NOT NULL DEFAULT 'cpa',
      payout_currency TEXT NOT NULL DEFAULT 'AUD',
      default_payout REAL,
      network TEXT,
      destination_url TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_offer_catalog_offer_key
    ON offer_catalog(offer_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_catalog_legacy_offer_id
    ON offer_catalog(legacy_offer_id)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_catalog_vertical
    ON offer_catalog(vertical)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_catalog_status
    ON offer_catalog(status)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS offer_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER REFERENCES offer_catalog(id),
      site_key TEXT NOT NULL,
      intent_key TEXT,
      page_type TEXT,
      entity_slug TEXT,
      state_slug TEXT,
      country_code TEXT NOT NULL DEFAULT 'AU',
      priority INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_rules_offer_id
    ON offer_rules(offer_id)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_rules_site_key
    ON offer_rules(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_rules_intent_key
    ON offer_rules(intent_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_offer_rules_status
    ON offer_rules(status)
  `);
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_offer_rules_offer_site_intent_page
    ON offer_rules(offer_id, site_key, intent_key, page_type)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placement_key TEXT NOT NULL,
      site_key TEXT NOT NULL,
      page_type TEXT,
      component TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_placements_key
    ON affiliate_placements(placement_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_placements_site_key
    ON affiliate_placements(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_placements_status
    ON affiliate_placements(status)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      decision_key TEXT NOT NULL,
      site_key TEXT NOT NULL,
      domain TEXT,
      vertical TEXT NOT NULL,
      intent_key TEXT,
      page_type TEXT,
      entity_slug TEXT,
      placement_key TEXT,
      offer_key TEXT,
      fallback_reason TEXT,
      source TEXT NOT NULL DEFAULT 'rules_engine',
      context_json TEXT,
      decided_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_decisions_key
    ON affiliate_decisions(decision_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_decisions_site_key
    ON affiliate_decisions(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_decisions_offer_key
    ON affiliate_decisions(offer_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_decisions_decided_at
    ON affiliate_decisions(decided_at)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_click_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legacy_click_id INTEGER REFERENCES affiliate_clicks(id),
      site_key TEXT NOT NULL,
      domain TEXT,
      vertical TEXT NOT NULL,
      intent_key TEXT,
      page_type TEXT,
      entity_slug TEXT,
      suburb_slug TEXT,
      state_slug TEXT,
      placement_key TEXT NOT NULL,
      offer_key TEXT NOT NULL,
      decision_key TEXT,
      page_url TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_hash TEXT,
      occurred_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_legacy_click_id
    ON affiliate_click_events(legacy_click_id)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_site_key
    ON affiliate_click_events(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_offer_key
    ON affiliate_click_events(offer_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_click_events_occurred_at
    ON affiliate_click_events(occurred_at)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_conversion_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legacy_conversion_id INTEGER REFERENCES affiliate_conversions(id),
      legacy_click_id INTEGER REFERENCES affiliate_clicks(id),
      click_event_id INTEGER REFERENCES affiliate_click_events(id),
      site_key TEXT NOT NULL,
      domain TEXT,
      vertical TEXT NOT NULL,
      intent_key TEXT,
      page_type TEXT,
      entity_slug TEXT,
      offer_key TEXT NOT NULL,
      decision_key TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT,
      external_ref TEXT,
      payout_amount REAL,
      payout_currency TEXT NOT NULL DEFAULT 'AUD',
      metadata_json TEXT,
      occurred_at TEXT NOT NULL,
      confirmed_at TEXT
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversion_events_legacy_conversion_id
    ON affiliate_conversion_events(legacy_conversion_id)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversion_events_site_key
    ON affiliate_conversion_events(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversion_events_offer_key
    ON affiliate_conversion_events(offer_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversion_events_occurred_at
    ON affiliate_conversion_events(occurred_at)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_affiliate_conversion_events_external_ref
    ON affiliate_conversion_events(external_ref)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS weekly_rollups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      site_key TEXT NOT NULL,
      vertical TEXT NOT NULL,
      total_clicks INTEGER NOT NULL DEFAULT 0,
      total_conversions INTEGER NOT NULL DEFAULT 0,
      estimated_revenue REAL NOT NULL DEFAULT 0,
      confirmed_revenue REAL NOT NULL DEFAULT 0,
      top_offer_key TEXT,
      top_page_url TEXT,
      report_json TEXT,
      email_sent_at TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_weekly_rollups_week_start
    ON weekly_rollups(week_start)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_weekly_rollups_site_key
    ON weekly_rollups(site_key)
  `);
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_rollups_site_week
    ON weekly_rollups(week_start, site_key)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS payout_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_key TEXT NOT NULL,
      site_key TEXT,
      source TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'AUD',
      period_start TEXT,
      period_end TEXT,
      external_ref TEXT,
      notes TEXT,
      received_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_receipts_offer_key
    ON payout_receipts(offer_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_receipts_site_key
    ON payout_receipts(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_receipts_received_at
    ON payout_receipts(received_at)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_receipts_external_ref
    ON payout_receipts(external_ref)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS payout_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_key TEXT NOT NULL,
      offer_key TEXT NOT NULL,
      site_key TEXT,
      status TEXT NOT NULL DEFAULT 'monitoring',
      severity TEXT NOT NULL DEFAULT 'info',
      outstanding_amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'AUD',
      due_conversions INTEGER NOT NULL DEFAULT 0,
      oldest_occurred_at TEXT,
      due_at TEXT,
      last_escalated_at TEXT,
      email_stage TEXT,
      partner_email TEXT,
      email_subject TEXT,
      email_body TEXT,
      recommended_action TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT
    )
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_cases_case_key
    ON payout_cases(case_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_cases_offer_key
    ON payout_cases(offer_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_cases_site_key
    ON payout_cases(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_cases_status
    ON payout_cases(status)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payout_cases_severity
    ON payout_cases(severity)
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS policy_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_key TEXT NOT NULL,
      vertical TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      event_type TEXT NOT NULL,
      entity_slug TEXT,
      offer_key TEXT,
      message TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_policy_events_site_key
    ON policy_events(site_key)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_policy_events_severity
    ON policy_events(severity)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_policy_events_created_at
    ON policy_events(created_at)
  `);

  console.log("Seeding portfolio domains...");

  for (const domain of PORTFOLIO_DOMAIN_SEEDS) {
    const now = new Date().toISOString();
    await client.execute({
      sql: `
        INSERT INTO portfolio_domains (
          site_key,
          display_name,
          primary_domain,
          domain_aliases_json,
          vertical,
          status,
          default_currency,
          notes,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'AUD', ?, ?, ?)
        ON CONFLICT(site_key) DO UPDATE SET
          display_name = excluded.display_name,
          primary_domain = excluded.primary_domain,
          domain_aliases_json = excluded.domain_aliases_json,
          vertical = excluded.vertical,
          status = excluded.status,
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `,
      args: [
        domain.siteKey,
        domain.displayName,
        domain.primaryDomain,
        JSON.stringify(domain.domainAliases),
        domain.vertical,
        domain.status,
        domain.notes ?? null,
        now,
        now,
      ],
    });
  }

  console.log("Seeding offer catalog...");

  for (const offer of OFFER_CATALOG_SEEDS) {
    const now = new Date().toISOString();
    await client.execute({
      sql: `
        INSERT INTO offer_catalog (
          offer_key,
          legacy_offer_id,
          advertiser,
          display_name,
          vertical,
          status,
          payout_model,
          payout_currency,
          default_payout,
          network,
          destination_url,
          metadata_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(offer_key) DO UPDATE SET
          legacy_offer_id = excluded.legacy_offer_id,
          advertiser = excluded.advertiser,
          display_name = excluded.display_name,
          vertical = excluded.vertical,
          status = excluded.status,
          payout_model = excluded.payout_model,
          payout_currency = excluded.payout_currency,
          default_payout = excluded.default_payout,
          network = excluded.network,
          destination_url = excluded.destination_url,
          metadata_json = excluded.metadata_json,
          updated_at = excluded.updated_at
      `,
      args: [
        offer.offerKey,
        offer.legacyOfferId,
        offer.advertiser,
        offer.displayName,
        offer.vertical,
        offer.status,
        offer.payoutModel,
        offer.payoutCurrency,
        offer.defaultPayout,
        offer.network,
        offer.destinationUrl,
        JSON.stringify(offer.metadata),
        now,
        now,
      ],
    });
  }

  console.log("Seeding offer rules...");

  for (const rule of OFFER_RULE_SEEDS) {
    const now = new Date().toISOString();
    await client.execute({
      sql: `
        INSERT INTO offer_rules (
          offer_id,
          site_key,
          intent_key,
          page_type,
          country_code,
          priority,
          status,
          notes,
          created_at,
          updated_at
        )
        SELECT
          id,
          ?,
          ?,
          ?,
          'AU',
          ?,
          ?,
          ?,
          ?,
          ?
        FROM offer_catalog
        WHERE offer_key = ?
        ON CONFLICT(offer_id, site_key, intent_key, page_type) DO UPDATE SET
          priority = excluded.priority,
          status = excluded.status,
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `,
      args: [
        rule.siteKey,
        rule.intentKey,
        rule.pageType,
        rule.priority,
        rule.status,
        rule.notes ?? null,
        now,
        now,
        rule.offerKey,
      ],
    });
  }

  console.log("Seeding placements...");

  for (const placement of PLACEMENT_SEEDS) {
    const now = new Date().toISOString();
    await client.execute({
      sql: `
        INSERT INTO affiliate_placements (
          placement_key,
          site_key,
          page_type,
          component,
          label,
          status,
          notes,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(placement_key) DO UPDATE SET
          site_key = excluded.site_key,
          page_type = excluded.page_type,
          component = excluded.component,
          label = excluded.label,
          status = excluded.status,
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `,
      args: [
        placement.placementKey,
        placement.siteKey,
        placement.pageType,
        placement.component,
        placement.label,
        placement.status,
        placement.notes ?? null,
        now,
        now,
      ],
    });
  }

  console.log("Control-plane tables created successfully.");
}

migrate().catch((error) => {
  console.error("Failed to migrate control-plane tables:", error);
  process.exitCode = 1;
});
