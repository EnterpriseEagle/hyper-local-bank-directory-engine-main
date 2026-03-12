import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { suburbs, banks, branches, statusReports } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as Papa from "papaparse";

const client = createClient({ url: "file:./data/banknearme.db" });
const db = drizzle(client);

const STATES: Record<string, string> = {
  NSW: "new-south-wales",
  VIC: "victoria",
  QLD: "queensland",
  WA: "western-australia",
  SA: "south-australia",
  TAS: "tasmania",
  NT: "northern-territory",
  ACT: "australian-capital-territory",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const BANK_DATA = [
  { name: "Commonwealth Bank", slug: "commonwealth-bank", type: "big4", website: "https://www.commbank.com.au" },
  { name: "Westpac", slug: "westpac", type: "big4", website: "https://www.westpac.com.au" },
  { name: "ANZ", slug: "anz", type: "big4", website: "https://www.anz.com.au" },
  { name: "NAB", slug: "nab", type: "big4", website: "https://www.nab.com.au" },
  { name: "Bendigo Bank", slug: "bendigo-bank", type: "regional", website: "https://www.bendigobank.com.au" },
  { name: "Bank of Queensland", slug: "bank-of-queensland", type: "regional", website: "https://www.boq.com.au" },
  { name: "Suncorp", slug: "suncorp", type: "regional", website: "https://www.suncorp.com.au" },
  { name: "ING", slug: "ing", type: "digital", website: "https://www.ing.com.au" },
  { name: "Macquarie Bank", slug: "macquarie-bank", type: "regional", website: "https://www.macquarie.com.au" },
  { name: "Heritage Bank", slug: "heritage-bank", type: "credit_union", website: "https://www.heritage.com.au" },
  { name: "Greater Bank", slug: "greater-bank", type: "credit_union", website: "https://www.greater.com.au" },
  { name: "Bank Australia", slug: "bank-australia", type: "credit_union", website: "https://www.bankaust.com.au" },
  { name: "ME Bank", slug: "me-bank", type: "digital", website: "https://www.mebank.com.au" },
  { name: "Ubank", slug: "ubank", type: "digital", website: "https://www.ubank.com.au" },
  { name: "Up Bank", slug: "up-bank", type: "digital", website: "https://up.com.au" },
];

const BSB_PREFIXES: Record<string, string> = {
  "Commonwealth Bank": "06",
  "Westpac": "03",
  "ANZ": "01",
  "NAB": "08",
  "Bendigo Bank": "63",
  "Bank of Queensland": "12",
  "Suncorp": "48",
  "Macquarie Bank": "18",
  "Heritage Bank": "63",
  "Greater Bank": "63",
};

const FEE_RATINGS: Record<string, string> = {
  "Commonwealth Bank": "high",
  "Westpac": "high",
  "ANZ": "medium",
  "NAB": "medium",
  "Bendigo Bank": "low",
  "Bank of Queensland": "medium",
  "Suncorp": "medium",
  "ING": "none",
  "Macquarie Bank": "low",
  "Ubank": "none",
  "Up Bank": "none",
  "ME Bank": "none",
  "Heritage Bank": "low",
  "Greater Bank": "low",
  "Bank Australia": "low",
};

const OPENING_HOURS = JSON.stringify({
  mon: "9:30am - 4:00pm",
  tue: "9:30am - 4:00pm",
  wed: "9:30am - 4:00pm",
  thu: "9:30am - 5:00pm",
  fri: "9:30am - 5:00pm",
  sat: "Closed",
  sun: "Closed",
});

function randomFloat(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

async function seed() {
  console.log("Seeding database from CSV...");

  // Clear existing data in correct order
  await db.delete(statusReports);
  await db.delete(branches);
  await db.delete(suburbs);
  await db.delete(banks);

  // Insert banks
  const bankIds: Record<string, number> = {};
  for (const bank of BANK_DATA) {
    const result = await db.insert(banks).values(bank).returning({ id: banks.id });
    bankIds[bank.name] = result[0].id;
  }
  console.log(`Inserted ${BANK_DATA.length} banks`);

  // Read CSV
  const csvFile = fs.readFileSync("./data/suburbs.csv", "utf8");
  const results = Papa.parse(csvFile, { header: true });
  const data = results.data as any[];

  // Filter for Delivery Area and unique locality-postcode
  const seen = new Set<string>();
  const suburbsToInsert: any[] = [];

  for (const row of data) {
    if (row.type !== "Delivery Area") continue;
    const key = `${row.locality}-${row.postcode}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const state = row.state as string;
    const stateSlug = STATES[state];
    if (!stateSlug) continue;

    suburbsToInsert.push({
      name: row.locality,
      slug: slugify(row.locality) + "-" + row.postcode,
      postcode: row.postcode,
      state,
      stateSlug,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.long),
      branchCount: 0,
      atmCount: 0,
      population: Math.floor(Math.random() * 5000) + 100, // Random pop since CSV doesn't have it
    });

    if (suburbsToInsert.length >= 15548) break; // Limit to requested number
  }

  console.log(`Prepared ${suburbsToInsert.length} suburbs for insertion`);

  // Batch insert suburbs (SQLite has limits on variables, so we do chunks)
  const chunkSize = 100;
  for (let i = 0; i < suburbsToInsert.length; i += chunkSize) {
    const chunk = suburbsToInsert.slice(i, i + chunkSize);
    await db.insert(suburbs).values(chunk);
    if (i % 1000 === 0) console.log(`Inserted ${i} suburbs...`);
  }

  // To make it look realistic but not too slow, we'll only add branches to a subset of suburbs
  // or add 1-2 branches to many of them.
  console.log("Generating branches for a selection of suburbs...");
  
  const big4Banks = ["Commonwealth Bank", "Westpac", "ANZ", "NAB"];
  const allSuburbs = await db.select().from(suburbs);
  
  // Only add branches to ~2000 random suburbs to keep it manageable but populated
  const sampleSuburbs = allSuburbs.sort(() => Math.random() - 0.5).slice(0, 2000);

  for (const sub of sampleSuburbs) {
    const branchCount = Math.floor(Math.random() * 3) + 1;
    const atmCount = Math.floor(Math.random() * 2) + 1;

    // Update suburb counts
    await db.update(suburbs)
      .set({ branchCount, atmCount })
      .where(eq(suburbs.id, sub.id));

    // Insert branches
    for (let i = 0; i < branchCount; i++) {
      const bankName = big4Banks[Math.floor(Math.random() * big4Banks.length)];
      const bsbPrefix = BSB_PREFIXES[bankName] || "99";
      const bsb = `${bsbPrefix}${Math.floor(Math.random() * 9000 + 1000).toString().slice(0,4)}`;

      await db.insert(branches).values({
        bankId: bankIds[bankName],
        suburbId: sub.id,
        name: `${bankName} ${sub.name}`,
        address: `${Math.floor(Math.random() * 300 + 1)} High St, ${sub.name} ${sub.state} ${sub.postcode}`,
        postcode: sub.postcode,
        lat: sub.lat + (Math.random() - 0.5) * 0.01,
        lng: sub.lng + (Math.random() - 0.5) * 0.01,
        type: "branch",
        status: "open",
        bsb: `${bsb.slice(0,3)}-${bsb.slice(3)}`,
        openingHours: OPENING_HOURS,
        distanceKm: randomFloat(0.5, 5.0),
        feeRating: FEE_RATINGS[bankName] || "medium",
      });
    }

    // Insert ATMs
    for (let i = 0; i < atmCount; i++) {
      const bankName = big4Banks[Math.floor(Math.random() * big4Banks.length)];
      await db.insert(branches).values({
        bankId: bankIds[bankName],
        suburbId: sub.id,
        name: `${bankName} ATM - ${sub.name}`,
        address: `Shopping Centre, ${sub.name} ${sub.state} ${sub.postcode}`,
        postcode: sub.postcode,
        lat: sub.lat + (Math.random() - 0.5) * 0.015,
        lng: sub.lng + (Math.random() - 0.5) * 0.015,
        type: "atm",
        status: "open",
        distanceKm: randomFloat(0.2, 3.0),
        feeRating: "none",
      });
    }
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
