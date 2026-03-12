/**
 * Run this once to create the monetization tables.
 * Usage: npx tsx src/lib/db/migrate-monetization.ts
 */
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL?.trim() || "file:./data/banknearme.db";
const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

const client = createClient({
  url: databaseUrl,
  ...(authToken ? { authToken } : {}),
});

async function migrate() {
  console.log("Creating monetization tables...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id TEXT NOT NULL,
      placement TEXT NOT NULL,
      page_url TEXT,
      suburb_slug TEXT,
      state_slug TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_hash TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      click_id INTEGER REFERENCES affiliate_clicks(id),
      offer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      revenue_estimate REAL,
      source TEXT,
      external_ref TEXT,
      created_at TEXT NOT NULL,
      confirmed_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS weekly_digests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      total_clicks INTEGER NOT NULL DEFAULT 0,
      total_conversions INTEGER NOT NULL DEFAULT 0,
      estimated_revenue REAL NOT NULL DEFAULT 0,
      top_offer TEXT,
      top_page TEXT,
      email_sent_at TEXT,
      report_json TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Indexes for fast querying in weekly reports
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_clicks_created ON affiliate_clicks(created_at)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_clicks_offer ON affiliate_clicks(offer_id)
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_conversions_created ON affiliate_conversions(created_at)
  `);

  console.log("Monetization tables created successfully.");
}

migrate().catch(console.error);
