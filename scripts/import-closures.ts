import { createClient } from "@libsql/client";

const db = createClient({ url: "file:./data/banknearme.db" });

interface Closure {
  bankName: string;
  bankSlug: string;
  suburb: string;
  state: string;
  year: number;
}

const closures: Closure[] = [
  // CBA
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Nerang", state: "QLD", year: 2023 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Coogee", state: "NSW", year: 2024 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Coolangatta", state: "QLD", year: 2024 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Annandale", state: "NSW", year: 2022 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Toongabbie", state: "NSW", year: 2022 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Lindfield", state: "NSW", year: 2022 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Drysdale", state: "VIC", year: 2022 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Woodend", state: "VIC", year: 2022 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Regents Park", state: "NSW", year: 2023 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Pendle Hill", state: "NSW", year: 2023 },
  { bankName: "Commonwealth Bank", bankSlug: "commonwealth-bank", suburb: "Guildford", state: "NSW", year: 2023 },
  // NAB
  { bankName: "NAB", bankSlug: "nab", suburb: "Balmain", state: "NSW", year: 2024 },
  { bankName: "NAB", bankSlug: "nab", suburb: "Emerald", state: "VIC", year: 2024 },
  { bankName: "NAB", bankSlug: "nab", suburb: "Runaway Bay", state: "QLD", year: 2024 },
  { bankName: "NAB", bankSlug: "nab", suburb: "Scone", state: "NSW", year: 2024 },
  { bankName: "NAB", bankSlug: "nab", suburb: "Cessnock", state: "NSW", year: 2024 },
  { bankName: "NAB", bankSlug: "nab", suburb: "Caringbah", state: "NSW", year: 2025 },
  { bankName: "NAB", bankSlug: "nab", suburb: "Mentone", state: "VIC", year: 2025 },
  // ANZ
  { bankName: "ANZ", bankSlug: "anz", suburb: "Katoomba", state: "NSW", year: 2024 },
  { bankName: "ANZ", bankSlug: "anz", suburb: "Murwillumbah", state: "NSW", year: 2024 },
  { bankName: "ANZ", bankSlug: "anz", suburb: "Gladstone Park", state: "VIC", year: 2024 },
  { bankName: "ANZ", bankSlug: "anz", suburb: "Endeavour Hills", state: "VIC", year: 2024 },
  // Westpac
  { bankName: "Westpac", bankSlug: "westpac", suburb: "Hamilton", state: "NSW", year: 2024 },
  { bankName: "Westpac", bankSlug: "westpac", suburb: "Mortdale", state: "NSW", year: 2024 },
  { bankName: "Westpac", bankSlug: "westpac", suburb: "Neutral Bay", state: "NSW", year: 2024 },
  { bankName: "Westpac", bankSlug: "westpac", suburb: "Cronulla", state: "NSW", year: 2022 },
  { bankName: "Westpac", bankSlug: "westpac", suburb: "Kingsgrove", state: "NSW", year: 2022 },
  // Bank of Melbourne
  { bankName: "Bank of Melbourne", bankSlug: "bank-of-melbourne", suburb: "Broadmeadows", state: "VIC", year: 2024 },
  { bankName: "Bank of Melbourne", bankSlug: "bank-of-melbourne", suburb: "Airport West", state: "VIC", year: 2024 },
  { bankName: "Bank of Melbourne", bankSlug: "bank-of-melbourne", suburb: "South Morang", state: "VIC", year: 2024 },
  { bankName: "Bank of Melbourne", bankSlug: "bank-of-melbourne", suburb: "Point Cook", state: "VIC", year: 2024 },
  // St.George
  { bankName: "St.George", bankSlug: "st-george", suburb: "Bentleigh", state: "VIC", year: 2022 },
  { bankName: "St.George", bankSlug: "st-george", suburb: "Eltham", state: "VIC", year: 2022 },
  { bankName: "St.George", bankSlug: "st-george", suburb: "Reservoir", state: "VIC", year: 2022 },
  // BOQ
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Caloundra", state: "QLD", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Carindale", state: "QLD", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Springwood", state: "QLD", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Toowong", state: "QLD", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Newtown", state: "NSW", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Richmond", state: "VIC", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Moonee Ponds", state: "VIC", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Manly", state: "NSW", year: 2025 },
  { bankName: "Bank of Queensland", bankSlug: "bank-of-queensland", suburb: "Byron Bay", state: "NSW", year: 2025 },
  // Bendigo Bank
  { bankName: "Bendigo Bank", bankSlug: "bendigo-bank", suburb: "South Melbourne", state: "VIC", year: 2025 },
  { bankName: "Bendigo Bank", bankSlug: "bendigo-bank", suburb: "Korumburra", state: "VIC", year: 2025 },
  { bankName: "Bendigo Bank", bankSlug: "bendigo-bank", suburb: "Bannockburn", state: "VIC", year: 2025 },
];

async function main() {
  let updated = 0;
  let inserted = 0;
  let notFound = 0;
  let reopenedAtms = 0;
  let ambiguous = 0;

  for (const c of closures) {
    // Find bank_id
    const bankResult = await db.execute({
      sql: "SELECT id FROM banks WHERE slug = ?",
      args: [c.bankSlug],
    });
    if (bankResult.rows.length === 0) {
      console.log(`WARN: Bank not found: ${c.bankName} (${c.bankSlug})`);
      notFound++;
      continue;
    }
    const bankId = bankResult.rows[0].id as number;

    // Find suburb_id (case-insensitive match, also match state)
    const suburbResult = await db.execute({
      sql: "SELECT id, postcode, lat, lng FROM suburbs WHERE UPPER(name) = UPPER(?) AND state = ?",
      args: [c.suburb, c.state],
    });
    if (suburbResult.rows.length === 0) {
      console.log(`WARN: Suburb not found: ${c.suburb}, ${c.state}`);
      notFound++;
      continue;
    }
    const suburbId = suburbResult.rows[0].id as number;
    const postcode = (suburbResult.rows[0].postcode as string) || "0000";
    const lat = (suburbResult.rows[0].lat as number) || 0;
    const lng = (suburbResult.rows[0].lng as number) || 0;

    // Reopen any ATMs previously closed by the old suburb-wide update logic.
    const reopenAtmResult = await db.execute({
      sql: "UPDATE branches SET status = 'open', closed_date = NULL WHERE bank_id = ? AND suburb_id = ? AND type = 'atm' AND status = 'closed'",
      args: [bankId, suburbId],
    });
    reopenedAtms += reopenAtmResult.rowsAffected;

    // Find existing branch rows only.
    const branchResult = await db.execute({
      sql: "SELECT id FROM branches WHERE bank_id = ? AND suburb_id = ? AND type = 'branch'",
      args: [bankId, suburbId],
    });

    const closedDate = `${c.year}-12-31`;

    if (branchResult.rows.length > 1) {
      console.log(`WARN: Multiple branch rows for ${c.bankName} in ${c.suburb}, ${c.state}; skipping ambiguous closure`);
      ambiguous++;
      continue;
    }

    if (branchResult.rows.length === 1) {
      // Update the matching branch.
      const res = await db.execute({
        sql: "UPDATE branches SET status = 'closed', closed_date = ? WHERE bank_id = ? AND suburb_id = ? AND type = 'branch'",
        args: [closedDate, bankId, suburbId],
      });
      updated += res.rowsAffected;
      console.log(`UPDATED: ${c.bankName} in ${c.suburb}, ${c.state} (${res.rowsAffected} row(s))`);
    } else {
      // Insert as closed branch
      const address = `${c.suburb}, ${c.state}`;
      await db.execute({
        sql: "INSERT INTO branches (bank_id, suburb_id, name, address, postcode, lat, lng, type, status, closed_date) VALUES (?, ?, ?, ?, ?, ?, ?, 'branch', 'closed', ?)",
        args: [bankId, suburbId, c.bankName, address, postcode, lat, lng, closedDate],
      });
      inserted++;
      console.log(`INSERTED: ${c.bankName} in ${c.suburb}, ${c.state} (closed ${closedDate})`);
    }
  }

  // Recalculate suburb counts after the closure sync.
  await db.execute({
    sql: `UPDATE suburbs SET
      branch_count = (
        SELECT COUNT(*) FROM branches
        WHERE branches.suburb_id = suburbs.id AND branches.type = 'branch' AND branches.status = 'open'
      ),
      atm_count = (
        SELECT COUNT(*) FROM branches
        WHERE branches.suburb_id = suburbs.id AND branches.type = 'atm' AND branches.status = 'open'
      ),
      closed_branches = (
        SELECT COUNT(*) FROM branches
        WHERE branches.suburb_id = suburbs.id AND branches.type = 'branch' AND branches.status = 'closed'
      ),
      closed_atms = (
        SELECT COUNT(*) FROM branches
        WHERE branches.suburb_id = suburbs.id AND branches.type = 'atm' AND branches.status = 'closed'
      )
    `,
    args: [],
  });
  console.log("\nRecalculated suburb branch/ATM closure counts.");

  // Verify
  const verifyResult = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM branches WHERE status = 'closed'",
    args: [],
  });
  const suburbsWithClosed = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM suburbs WHERE closed_branches > 0",
    args: [],
  });

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total closures to process: ${closures.length}`);
  console.log(`Branches updated (existing): ${updated}`);
  console.log(`Branches inserted (new): ${inserted}`);
  console.log(`ATMs reopened: ${reopenedAtms}`);
  console.log(`Ambiguous closures skipped: ${ambiguous}`);
  console.log(`Not found (skipped): ${notFound}`);
  console.log(`Total closed branches in DB: ${verifyResult.rows[0].cnt}`);
  console.log(`Suburbs with closed branches: ${suburbsWithClosed.rows[0].cnt}`);
}

main().catch(console.error);
