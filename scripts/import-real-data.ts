import { createClient } from "@libsql/client";

const db = createClient({ url: "file:./data/banknearme.db" });

// ─── Bank matching config ───────────────────────────────────────────────────
// Maps lowercase search patterns to bank info.
// We'll check OSM name/brand/operator against these patterns.
const BANK_PATTERNS: {
  patterns: string[];
  name: string;
  slug: string;
  type: string;
}[] = [
  { patterns: ["commonwealth bank", "commbank", "comm bank", "cba", "commonwealth"], name: "Commonwealth Bank", slug: "commonwealth-bank", type: "big4" },
  { patterns: ["westpac"], name: "Westpac", slug: "westpac", type: "big4" },
  { patterns: ["anz", "australia and new zealand"], name: "ANZ", slug: "anz", type: "big4" },
  { patterns: ["nab", "national australia bank"], name: "NAB", slug: "nab", type: "big4" },
  { patterns: ["bendigo bank", "bendigo and adelaide", "bendigo"], name: "Bendigo Bank", slug: "bendigo-bank", type: "regional" },
  { patterns: ["bank of queensland", "boq"], name: "Bank of Queensland", slug: "bank-of-queensland", type: "regional" },
  { patterns: ["suncorp"], name: "Suncorp", slug: "suncorp", type: "regional" },
  { patterns: ["ing"], name: "ING", slug: "ing", type: "digital" },
  { patterns: ["macquarie bank", "macquarie"], name: "Macquarie Bank", slug: "macquarie-bank", type: "regional" },
  { patterns: ["heritage bank", "heritage"], name: "Heritage Bank", slug: "heritage-bank", type: "credit_union" },
  { patterns: ["greater bank"], name: "Greater Bank", slug: "greater-bank", type: "credit_union" },
  { patterns: ["bank australia"], name: "Bank Australia", slug: "bank-australia", type: "credit_union" },
  { patterns: ["me bank", "members equity"], name: "ME Bank", slug: "me-bank", type: "digital" },
  { patterns: ["ubank"], name: "Ubank", slug: "ubank", type: "digital" },
  { patterns: ["up bank"], name: "Up Bank", slug: "up-bank", type: "digital" },
  // Additional banks to add
  { patterns: ["st george", "st.george", "stgeorge"], name: "St.George", slug: "st-george", type: "regional" },
  { patterns: ["bankwest", "bank west"], name: "Bankwest", slug: "bankwest", type: "regional" },
  { patterns: ["hsbc"], name: "HSBC", slug: "hsbc", type: "international" },
  { patterns: ["bank of china", "boc"], name: "Bank of China", slug: "bank-of-china", type: "international" },
  { patterns: ["citibank", "citi bank"], name: "Citibank", slug: "citibank", type: "international" },
  { patterns: ["credit union australia", "cua", "great southern bank"], name: "Great Southern Bank", slug: "great-southern-bank", type: "credit_union" },
  { patterns: ["peoples choice", "people's choice"], name: "People's Choice Credit Union", slug: "peoples-choice", type: "credit_union" },
  { patterns: ["teachers mutual", "teachers credit"], name: "Teachers Mutual Bank", slug: "teachers-mutual-bank", type: "credit_union" },
  { patterns: ["beyond bank"], name: "Beyond Bank", slug: "beyond-bank", type: "credit_union" },
  { patterns: ["newcastle permanent"], name: "Newcastle Permanent", slug: "newcastle-permanent", type: "credit_union" },
  { patterns: ["bank sa", "banksa"], name: "BankSA", slug: "banksa", type: "regional" },
  { patterns: ["rabobank"], name: "Rabobank", slug: "rabobank", type: "international" },
  { patterns: ["bank of melbourne", "bom"], name: "Bank of Melbourne", slug: "bank-of-melbourne", type: "regional" },
  { patterns: ["rural bank"], name: "Rural Bank", slug: "rural-bank", type: "regional" },
  { patterns: ["p&n bank", "p & n bank"], name: "P&N Bank", slug: "pn-bank", type: "credit_union" },
  { patterns: ["qudos bank"], name: "Qudos Bank", slug: "qudos-bank", type: "credit_union" },
  { patterns: ["australian military bank", "defence bank"], name: "Defence Bank", slug: "defence-bank", type: "credit_union" },
  { patterns: ["hume bank"], name: "Hume Bank", slug: "hume-bank", type: "credit_union" },
  { patterns: ["imb bank", "imb"], name: "IMB Bank", slug: "imb-bank", type: "credit_union" },
  { patterns: ["arab bank"], name: "Arab Bank", slug: "arab-bank", type: "international" },
  { patterns: ["regional australia bank"], name: "Regional Australia Bank", slug: "regional-australia-bank", type: "regional" },
  { patterns: ["bcu"], name: "BCU", slug: "bcu", type: "credit_union" },
];

// ─── Haversine distance ─────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Fetch Overpass data ────────────────────────────────────────────────────
async function fetchOverpassData(): Promise<any[]> {
  const query = `[out:json][timeout:300];area["ISO3166-1"="AU"]->.au;(node["amenity"="bank"](area.au);way["amenity"="bank"](area.au);node["amenity"="atm"](area.au););out center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  console.log("Fetching data from Overpass API (this may take a few minutes)...");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Overpass API error: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  console.log(`Fetched ${data.elements.length} elements from Overpass API`);
  return data.elements;
}

// ─── Match an OSM element to a bank ─────────────────────────────────────────
function matchBank(tags: Record<string, string>): typeof BANK_PATTERNS[0] | null {
  const fields = [
    tags.name,
    tags.brand,
    tags.operator,
    tags["brand:wikidata"],
    tags["operator:wikidata"],
  ].filter(Boolean).map(s => s!.toLowerCase());

  for (const bankDef of BANK_PATTERNS) {
    for (const field of fields) {
      for (const pattern of bankDef.patterns) {
        if (field.includes(pattern)) {
          return bankDef;
        }
      }
    }
  }
  return null;
}

// ─── Build address from tags ────────────────────────────────────────────────
function buildAddress(tags: Record<string, string>, suburbName: string, state: string): string {
  const parts: string[] = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  else parts.push(suburbName);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  else parts.push(state);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  return parts.join(", ");
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  // 1) Load suburbs into memory for fast lookup
  console.log("Loading suburbs from database...");
  const suburbRows = await db.execute("SELECT id, name, slug, postcode, state, state_slug, lat, lng FROM suburbs");
  const suburbs = suburbRows.rows.map(r => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    postcode: r.postcode as string,
    state: r.state as string,
    state_slug: r.state_slug as string,
    lat: r.lat as number,
    lng: r.lng as number,
  }));
  console.log(`Loaded ${suburbs.length} suburbs`);

  // Build a spatial grid for fast nearest-suburb lookups (1-degree cells)
  const grid: Map<string, typeof suburbs> = new Map();
  for (const sub of suburbs) {
    const key = `${Math.floor(sub.lat)},${Math.floor(sub.lng)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(sub);
  }

  // Build a name lookup for suburb name matching (normalized name -> suburb[])
  const suburbsByName: Map<string, typeof suburbs> = new Map();
  for (const sub of suburbs) {
    const key = sub.name.toLowerCase().trim();
    if (!suburbsByName.has(key)) suburbsByName.set(key, []);
    suburbsByName.get(key)!.push(sub);
  }

  function findNearestSuburb(lat: number, lng: number, tags: Record<string, string>): typeof suburbs[0] | null {
    const cellLat = Math.floor(lat);
    const cellLng = Math.floor(lng);
    let candidates: { sub: typeof suburbs[0]; dist: number }[] = [];

    // Check surrounding cells (3x3)
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        const key = `${cellLat + dLat},${cellLng + dLng}`;
        const cell = grid.get(key);
        if (!cell) continue;
        for (const sub of cell) {
          const dist = haversineKm(lat, lng, sub.lat, sub.lng);
          if (dist < 50) {
            candidates.push({ sub, dist });
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // If OSM has addr:suburb, try to match by name first among close candidates
    const osmSuburb = (tags["addr:suburb"] || tags["addr:city"] || "").toLowerCase().trim();
    if (osmSuburb) {
      // Look for exact name match among candidates within 20km
      const nameMatch = candidates
        .filter(c => c.dist < 20 && c.sub.name.toLowerCase().trim() === osmSuburb)
        .sort((a, b) => a.dist - b.dist);
      if (nameMatch.length > 0) return nameMatch[0].sub;

      // Also check the name lookup for postcode-based tiebreaking
      const osmPostcode = tags["addr:postcode"] || "";
      if (osmPostcode) {
        const nameMatches = suburbsByName.get(osmSuburb) || [];
        const postcodeMatch = nameMatches.find(s => s.postcode === osmPostcode);
        if (postcodeMatch) return postcodeMatch;
      }
    }

    // Fallback: nearest by distance
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0].sub;
  }

  // 2) Load existing banks
  console.log("Loading existing banks...");
  const bankRows = await db.execute("SELECT id, name, slug FROM banks");
  const bankIdBySlug: Map<string, number> = new Map();
  for (const r of bankRows.rows) {
    bankIdBySlug.set(r.slug as string, r.id as number);
  }
  let nextBankId = Math.max(...Array.from(bankIdBySlug.values())) + 1;

  // 3) Fetch Overpass data
  const elements = await fetchOverpassData();

  // 4) Process elements
  console.log("Processing elements...");
  const branchInserts: {
    bank_id: number;
    suburb_id: number;
    name: string;
    address: string;
    postcode: string;
    lat: number;
    lng: number;
    type: string;
    status: string;
    bsb: string | null;
    opening_hours: string | null;
  }[] = [];

  const stats = {
    total: elements.length,
    matched: 0,
    unmatched: 0,
    noSuburb: 0,
    branches: 0,
    atms: 0,
    bankCounts: new Map<string, number>(),
    unmatchedNames: new Map<string, number>(),
    newBanksAdded: [] as string[],
  };

  for (const el of elements) {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    if (lat == null || lng == null) continue;

    // Determine type
    const amenity = tags.amenity;
    const branchType = amenity === "atm" ? "atm" : "branch";

    // Match to a bank
    const bankDef = matchBank(tags);
    if (!bankDef) {
      stats.unmatched++;
      const unmatchedName = tags.name || tags.brand || tags.operator || "unknown";
      stats.unmatchedNames.set(unmatchedName, (stats.unmatchedNames.get(unmatchedName) || 0) + 1);
      continue;
    }
    stats.matched++;

    // Get or create bank ID
    let bankId = bankIdBySlug.get(bankDef.slug);
    if (bankId == null) {
      bankId = nextBankId++;
      bankIdBySlug.set(bankDef.slug, bankId);
      await db.execute({
        sql: "INSERT INTO banks (id, name, slug, type) VALUES (?, ?, ?, ?)",
        args: [bankId, bankDef.name, bankDef.slug, bankDef.type],
      });
      stats.newBanksAdded.push(bankDef.name);
      console.log(`  Added new bank: ${bankDef.name} (id=${bankId})`);
    }

    // Find nearest suburb (prefer OSM address name match)
    const suburb = findNearestSuburb(lat, lng, tags);
    if (!suburb) {
      stats.noSuburb++;
      continue;
    }

    // Build address
    const address = buildAddress(tags, suburb.name, suburb.state);
    const postcode = tags["addr:postcode"] || suburb.postcode;
    const name = tags.name || `${bankDef.name} ${suburb.name}`;
    const openingHours = tags.opening_hours || null;

    branchInserts.push({
      bank_id: bankId,
      suburb_id: suburb.id,
      name,
      address,
      postcode,
      lat,
      lng,
      type: branchType,
      status: "open",
      bsb: null,
      opening_hours: openingHours,
    });

    if (branchType === "atm") stats.atms++;
    else stats.branches++;

    stats.bankCounts.set(bankDef.name, (stats.bankCounts.get(bankDef.name) || 0) + 1);
  }

  // 5) Delete existing branches and insert new ones
  console.log(`\nDeleting existing branches...`);
  await db.execute("DELETE FROM branches");

  console.log(`Inserting ${branchInserts.length} real branches/ATMs...`);
  const BATCH_SIZE = 200;
  for (let i = 0; i < branchInserts.length; i += BATCH_SIZE) {
    const batch = branchInserts.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",");
    const args = batch.flatMap(b => [
      b.bank_id, b.suburb_id, b.name, b.address, b.postcode,
      b.lat, b.lng, b.type, b.status, b.bsb, b.opening_hours,
    ]);
    await db.execute({
      sql: `INSERT INTO branches (bank_id, suburb_id, name, address, postcode, lat, lng, type, status, bsb, opening_hours) VALUES ${placeholders}`,
      args,
    });
    if ((i / BATCH_SIZE) % 10 === 0) {
      process.stdout.write(`  Inserted ${Math.min(i + BATCH_SIZE, branchInserts.length)} / ${branchInserts.length}\r`);
    }
  }
  console.log();

  // 6) Update suburb branch/atm counts
  console.log("Updating suburb branch/atm counts...");
  await db.execute(`
    UPDATE suburbs SET
      branch_count = (SELECT COUNT(*) FROM branches WHERE branches.suburb_id = suburbs.id AND branches.type = 'branch' AND branches.status = 'open'),
      atm_count = (SELECT COUNT(*) FROM branches WHERE branches.suburb_id = suburbs.id AND branches.type = 'atm' AND branches.status = 'open'),
      closed_branches = (SELECT COUNT(*) FROM branches WHERE branches.suburb_id = suburbs.id AND branches.type = 'branch' AND branches.status = 'closed'),
      closed_atms = (SELECT COUNT(*) FROM branches WHERE branches.suburb_id = suburbs.id AND branches.type = 'atm' AND branches.status = 'closed')
  `);

  // 7) Print statistics
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  IMPORT COMPLETE");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  Total OSM elements:    ${stats.total}`);
  console.log(`  Matched to a bank:     ${stats.matched}`);
  console.log(`  Unmatched:             ${stats.unmatched}`);
  console.log(`  No suburb within 50km: ${stats.noSuburb}`);
  console.log(`  Branches inserted:     ${stats.branches}`);
  console.log(`  ATMs inserted:         ${stats.atms}`);
  console.log(`  Total inserted:        ${branchInserts.length}`);
  console.log(`  Time elapsed:          ${elapsed}s`);

  if (stats.newBanksAdded.length > 0) {
    console.log(`\n  New banks added: ${stats.newBanksAdded.join(", ")}`);
  }

  console.log("\n  Branches per bank:");
  const sorted = [...stats.bankCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted) {
    console.log(`    ${name.padEnd(30)} ${count}`);
  }

  if (stats.unmatchedNames.size > 0) {
    console.log("\n  Top 20 unmatched names:");
    const topUnmatched = [...stats.unmatchedNames.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [name, count] of topUnmatched) {
      console.log(`    ${name.padEnd(40)} ${count}`);
    }
  }

  console.log("══════════════════════════════════════════════════════\n");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
