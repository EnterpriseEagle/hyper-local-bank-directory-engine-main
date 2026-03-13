import { db } from "./db";
import { suburbs, branches, banks, statusReports } from "./db/schema";
import { eq, sql, and, desc, asc, ne, like, inArray } from "drizzle-orm";
import { type BranchModerationTarget } from "./reports/types";

export const STATE_NAMES: Record<string, string> = {
  "new-south-wales": "New South Wales",
  victoria: "Victoria",
  queensland: "Queensland",
  "western-australia": "Western Australia",
  "south-australia": "South Australia",
  tasmania: "Tasmania",
  "northern-territory": "Northern Territory",
  "australian-capital-territory": "Australian Capital Territory",
};

export const STATE_ABBR: Record<string, string> = {
  "new-south-wales": "NSW",
  victoria: "VIC",
  queensland: "QLD",
  "western-australia": "WA",
  "south-australia": "SA",
  tasmania: "TAS",
  "northern-territory": "NT",
  "australian-capital-territory": "ACT",
};

export async function getStats() {
  const [suburbCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(suburbs);
  const [branchCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(branches)
    .where(and(eq(branches.type, "branch"), eq(branches.status, "open")));
  const [closedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(branches)
    .where(and(eq(branches.type, "branch"), eq(branches.status, "closed")));
  const [atmCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(branches)
    .where(and(eq(branches.type, "atm"), eq(branches.status, "open")));
  const [reportCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports);

  return {
    suburbs: suburbCount.count,
    openBranches: branchCount.count,
    closedBranches: closedCount.count,
    atms: atmCount.count,
    totalReports: reportCount.count,
  };
}

export async function getStateList() {
  const results = await db
    .select({
      stateSlug: suburbs.stateSlug,
      state: suburbs.state,
      count: sql<number>`count(*)`,
    })
    .from(suburbs)
    .groupBy(suburbs.stateSlug, suburbs.state)
    .orderBy(asc(suburbs.state));
  return results;
}

export async function getSuburbsByState(stateSlug: string) {
  return db
    .select()
    .from(suburbs)
    .where(eq(suburbs.stateSlug, stateSlug))
    .orderBy(asc(suburbs.name));
}

export async function getSuburbBySlug(slug: string) {
  return getSuburbBySlugInState(slug);
}

export async function getSuburbBySlugInState(slug: string, stateSlug?: string) {
  const exactWhere = stateSlug
    ? and(eq(suburbs.slug, slug), eq(suburbs.stateSlug, stateSlug))
    : eq(suburbs.slug, slug);

  // Try exact match first (e.g. "parramatta-2150")
  const [exact] = await db
    .select()
    .from(suburbs)
    .where(exactWhere)
    .limit(1);
  if (exact) return exact;

  // Fallback: match clean slug to "<slug>-1234", not arbitrary longer prefixes.
  const fallbackWhere = stateSlug
    ? and(like(suburbs.slug, `${slug}-____`), eq(suburbs.stateSlug, stateSlug))
    : like(suburbs.slug, `${slug}-____`);

  const [fallback] = await db
    .select()
    .from(suburbs)
    .where(fallbackWhere)
    .orderBy(
      desc(sql`${suburbs.branchCount} + ${suburbs.atmCount}`),
      desc(suburbs.branchCount),
      asc(suburbs.postcode)
    )
    .limit(1);

  return fallback;
}

async function syncSuburbBranchStats(suburbId: number) {
  const [counts] = await db
    .select({
      branchCount: sql<number>`COALESCE(SUM(CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN 1 ELSE 0 END), 0)`,
      atmCount: sql<number>`COALESCE(SUM(CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN 1 ELSE 0 END), 0)`,
      closedBranches: sql<number>`COALESCE(SUM(CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'closed' THEN 1 ELSE 0 END), 0)`,
      closedAtms: sql<number>`COALESCE(SUM(CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'closed' THEN 1 ELSE 0 END), 0)`,
    })
    .from(branches)
    .where(eq(branches.suburbId, suburbId));

  await db
    .update(suburbs)
    .set({
      branchCount: counts?.branchCount ?? 0,
      atmCount: counts?.atmCount ?? 0,
      closedBranches: counts?.closedBranches ?? 0,
      closedAtms: counts?.closedAtms ?? 0,
    })
    .where(eq(suburbs.id, suburbId));
}

export async function getBranchesForSuburb(suburbId: number) {
  return db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      lat: branches.lat,
      lng: branches.lng,
      type: branches.type,
      status: branches.status,
      bsb: branches.bsb,
      openingHours: branches.openingHours,
      closedDate: branches.closedDate,
      distanceKm: branches.distanceKm,
      feeRating: branches.feeRating,
      bankName: banks.name,
      bankSlug: banks.slug,
      bankType: banks.type,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .where(eq(branches.suburbId, suburbId))
    .orderBy(asc(branches.distanceKm));
}

export async function searchSuburbs(query: string, limit = 10) {
  return db
    .select()
    .from(suburbs)
    .where(sql`lower(${suburbs.name}) LIKE ${`%${query.toLowerCase()}%`} OR ${suburbs.postcode} LIKE ${`%${query}%`}`)
    .limit(limit)
    .orderBy(asc(suburbs.name));
}

export async function getAllSuburbSlugs() {
  return db
    .select({ slug: suburbs.slug, stateSlug: suburbs.stateSlug })
    .from(suburbs);
}

export async function getRecentClosures(limit = 10) {
  return db
    .select({
      branchName: branches.name,
      closedDate: branches.closedDate,
      suburbName: suburbs.name,
      postcode: suburbs.postcode,
      state: suburbs.state,
      suburbSlug: suburbs.slug,
      stateSlug: suburbs.stateSlug,
    })
    .from(branches)
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(eq(branches.status, "closed"))
    .limit(limit);
}

export async function getNearbySuburbs(suburbId: number, stateSlug: string, limit = 6) {
  // Get the current suburb's coordinates
  const [current] = await db
    .select({ lat: suburbs.lat, lng: suburbs.lng })
    .from(suburbs)
    .where(eq(suburbs.id, suburbId))
    .limit(1);
  if (!current) return [];

  // Order by approximate distance using Euclidean on lat/lng (good enough for nearby)
  return db
    .select()
    .from(suburbs)
    .where(and(eq(suburbs.stateSlug, stateSlug), ne(suburbs.id, suburbId)))
    .orderBy(
      sql`(${suburbs.lat} - ${current.lat}) * (${suburbs.lat} - ${current.lat}) + (${suburbs.lng} - ${current.lng}) * (${suburbs.lng} - ${current.lng})`
    )
    .limit(limit);
}

export async function getRecentReportsForSuburb(suburbId: number, limit = 10) {
  return db
    .select({
      id: statusReports.id,
      branchId: statusReports.branchId,
      reportType: statusReports.reportType,
      createdAt: statusReports.createdAt,
      branchName: branches.name,
      branchType: branches.type,
    })
    .from(statusReports)
    .innerJoin(branches, eq(statusReports.branchId, branches.id))
    .where(eq(statusReports.suburbId, suburbId))
    .orderBy(desc(statusReports.createdAt))
    .limit(limit);
}

export async function getRecentReportsForBranchIds(branchIds: number[], limit = 10) {
  if (branchIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: statusReports.id,
      branchId: statusReports.branchId,
      reportType: statusReports.reportType,
      createdAt: statusReports.createdAt,
      branchName: branches.name,
      branchType: branches.type,
    })
    .from(statusReports)
    .innerJoin(branches, eq(statusReports.branchId, branches.id))
    .where(inArray(statusReports.branchId, branchIds))
    .orderBy(desc(statusReports.createdAt))
    .limit(limit);
}

export async function getReportCountForSuburb(suburbId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports)
    .where(eq(statusReports.suburbId, suburbId));
  return result.count;
}

export async function submitStatusReport(data: {
  branchId: number;
  suburbId: number;
  reportType: string;
  ipHash?: string;
}) {
  await db.insert(statusReports).values({
    branchId: data.branchId,
    suburbId: data.suburbId,
    reportType: data.reportType,
    createdAt: new Date().toISOString(),
    ipHash: data.ipHash || null,
  });

  if (data.reportType !== "branch_closed") {
    return;
  }

  const [branch] = await db
    .select({
      id: branches.id,
      status: branches.status,
      closedDate: branches.closedDate,
    })
    .from(branches)
    .where(and(eq(branches.id, data.branchId), eq(branches.suburbId, data.suburbId)))
    .limit(1);

  if (!branch || branch.status === "closed") {
    return;
  }

  const closedDateLabel = new Date().toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  });

  await db
    .update(branches)
    .set({
      status: "closed",
      closedDate: branch.closedDate || closedDateLabel,
    })
    .where(eq(branches.id, branch.id));

  await syncSuburbBranchStats(data.suburbId);
}

export async function getBranchModerationTargets(branchIds: number[]) {
  if (branchIds.length === 0) {
    return [];
  }

  return (await db
    .select({
      address: branches.address,
      bankName: banks.name,
      bankSlug: banks.slug,
      branchId: branches.id,
      branchName: branches.name,
      branchStatus: branches.status,
      branchType: branches.type,
      lat: branches.lat,
      lng: branches.lng,
      postcode: suburbs.postcode,
      stateSlug: suburbs.stateSlug,
      suburbName: suburbs.name,
      suburbSlug: suburbs.slug,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(inArray(branches.id, branchIds))) as BranchModerationTarget[];
}

export async function getClosureStatsForState(stateSlug: string) {
  const [result] = await db
    .select({
      totalClosed: sql<number>`count(*)`,
    })
    .from(branches)
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(and(eq(suburbs.stateSlug, stateSlug), eq(branches.status, "closed")));
  return result.totalClosed;
}

export async function getTopClosureSuburbs(limit = 10) {
  return db
    .select({
      name: suburbs.name,
      postcode: suburbs.postcode,
      state: suburbs.state,
      slug: suburbs.slug,
      stateSlug: suburbs.stateSlug,
      closedBranches: suburbs.closedBranches,
    })
    .from(suburbs)
    .where(sql`${suburbs.closedBranches} > 0`)
    .orderBy(desc(suburbs.closedBranches))
    .limit(limit);
}

export async function getRecentReportsGlobal(limit = 20) {
  return db
    .select({
      id: statusReports.id,
      reportType: statusReports.reportType,
      createdAt: statusReports.createdAt,
      branchName: branches.name,
      branchType: branches.type,
      suburbName: suburbs.name,
      postcode: suburbs.postcode,
      state: suburbs.state,
      suburbSlug: suburbs.slug,
      stateSlug: suburbs.stateSlug,
    })
    .from(statusReports)
    .innerJoin(branches, eq(statusReports.branchId, branches.id))
    .innerJoin(suburbs, eq(statusReports.suburbId, suburbs.id))
    .orderBy(desc(statusReports.createdAt))
    .limit(limit);
}

export async function getLiveOutageStats() {
  const [atmEmpty] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports)
    .where(eq(statusReports.reportType, "atm_empty"));
  const [branchClosed] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports)
    .where(eq(statusReports.reportType, "branch_closed"));
  const [closureNotice] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports)
    .where(eq(statusReports.reportType, "closure_notice"));
  const [longQueue] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports)
    .where(eq(statusReports.reportType, "long_queue"));
  const [working] = await db
    .select({ count: sql<number>`count(*)` })
    .from(statusReports)
    .where(eq(statusReports.reportType, "working"));

  return {
    atmEmpty: atmEmpty.count,
    branchClosed: branchClosed.count,
    closureNotice: closureNotice.count,
    longQueue: longQueue.count,
    working: working.count,
  };
}

export async function getOutageHotspots(limit = 8) {
  // Suburbs with the most non-working reports
  const results = await db
    .select({
      suburbName: suburbs.name,
      postcode: suburbs.postcode,
      state: suburbs.state,
      suburbSlug: suburbs.slug,
      stateSlug: suburbs.stateSlug,
      reportCount: sql<number>`count(*)`,
    })
    .from(statusReports)
    .innerJoin(suburbs, eq(statusReports.suburbId, suburbs.id))
    .where(sql`${statusReports.reportType} != 'working'`)
    .groupBy(suburbs.id, suburbs.name, suburbs.postcode, suburbs.state, suburbs.slug, suburbs.stateSlug)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);
    return results;
}

export async function getTopSuburbsByBranchCount(limit = 12) {
  return db
    .select({
      name: suburbs.name,
      slug: suburbs.slug,
      postcode: suburbs.postcode,
      state: suburbs.state,
      stateSlug: suburbs.stateSlug,
      branchCount: suburbs.branchCount,
      atmCount: suburbs.atmCount,
      closedBranches: suburbs.closedBranches,
    })
    .from(suburbs)
    .where(sql`${suburbs.branchCount} > 0`)
    .orderBy(desc(suburbs.branchCount), desc(suburbs.atmCount), asc(suburbs.name))
    .limit(limit);
}

export async function getTopSuburbsByAtmCount(limit = 12) {
  return db
    .select({
      name: suburbs.name,
      slug: suburbs.slug,
      postcode: suburbs.postcode,
      state: suburbs.state,
      stateSlug: suburbs.stateSlug,
      branchCount: suburbs.branchCount,
      atmCount: suburbs.atmCount,
      closedBranches: suburbs.closedBranches,
    })
    .from(suburbs)
    .where(sql`${suburbs.atmCount} > 0`)
    .orderBy(desc(suburbs.atmCount), desc(suburbs.branchCount), asc(suburbs.name))
    .limit(limit);
}

// ===== BANK PAGE DATA =====

export async function getAllBanks() {
  return db.select().from(banks).orderBy(asc(banks.name));
}

export async function getBankBySlug(slug: string) {
  const [bank] = await db.select().from(banks).where(eq(banks.slug, slug)).limit(1);
  return bank;
}

export async function getBankBranchStats(bankId: number) {
  const [openBranches] = await db
    .select({ count: sql<number>`count(*)` })
    .from(branches)
    .where(and(eq(branches.bankId, bankId), eq(branches.type, "branch"), eq(branches.status, "open")));
  const [closedBranches] = await db
    .select({ count: sql<number>`count(*)` })
    .from(branches)
    .where(and(eq(branches.bankId, bankId), eq(branches.type, "branch"), eq(branches.status, "closed")));
  const [atmCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(branches)
    .where(and(eq(branches.bankId, bankId), eq(branches.type, "atm"), eq(branches.status, "open")));
  return {
    openBranches: openBranches.count,
    closedBranches: closedBranches.count,
    atms: atmCount.count,
  };
}

export async function getBankStatesPresence(bankId: number) {
  return db
    .select({
      stateSlug: suburbs.stateSlug,
      state: suburbs.state,
      branchCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      atmCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      closedCount: sql<number>`count(DISTINCT CASE WHEN ${branches.status} = 'closed' THEN ${branches.id} END)`,
    })
    .from(branches)
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(eq(branches.bankId, bankId))
    .groupBy(suburbs.stateSlug, suburbs.state)
    .orderBy(asc(suburbs.state));
}

export async function getBanksInState(stateSlug: string, limit = 12) {
  return db
    .select({
      bankName: banks.name,
      bankSlug: banks.slug,
      bankType: banks.type,
      branchCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      atmCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      suburbCount: sql<number>`count(DISTINCT ${suburbs.id})`,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(eq(suburbs.stateSlug, stateSlug))
    .groupBy(banks.id, banks.name, banks.slug, banks.type)
    .orderBy(
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      asc(banks.name)
    )
    .limit(limit);
}

export async function getBankSuburbsInState(bankId: number, stateSlug: string) {
  return db
    .select({
      suburbName: suburbs.name,
      suburbSlug: suburbs.slug,
      postcode: suburbs.postcode,
      stateSlug: suburbs.stateSlug,
      branchCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      atmCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      closedCount: sql<number>`count(DISTINCT CASE WHEN ${branches.status} = 'closed' THEN ${branches.id} END)`,
    })
    .from(branches)
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(and(eq(branches.bankId, bankId), eq(suburbs.stateSlug, stateSlug)))
    .groupBy(suburbs.name, suburbs.slug, suburbs.postcode, suburbs.stateSlug)
    .orderBy(asc(suburbs.name));
}

export async function getTopSuburbsForBank(bankId: number, limit = 12) {
  return db
    .select({
      suburbName: suburbs.name,
      suburbSlug: suburbs.slug,
      postcode: suburbs.postcode,
      state: suburbs.state,
      stateSlug: suburbs.stateSlug,
      branchCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      atmCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      closedCount: sql<number>`count(DISTINCT CASE WHEN ${branches.status} = 'closed' THEN ${branches.id} END)`,
    })
    .from(branches)
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(eq(branches.bankId, bankId))
    .groupBy(suburbs.name, suburbs.slug, suburbs.postcode, suburbs.state, suburbs.stateSlug)
    .orderBy(
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      asc(suburbs.name)
    )
    .limit(limit);
}

export async function getBankBranchesInSuburb(bankId: number, suburbSlug: string) {
  return db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      lat: branches.lat,
      lng: branches.lng,
      type: branches.type,
      status: branches.status,
      bsb: branches.bsb,
      openingHours: branches.openingHours,
      closedDate: branches.closedDate,
      distanceKm: branches.distanceKm,
      feeRating: branches.feeRating,
      suburbName: suburbs.name,
      postcode: suburbs.postcode,
      state: suburbs.state,
      stateSlug: suburbs.stateSlug,
    })
    .from(branches)
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(and(eq(branches.bankId, bankId), eq(suburbs.slug, suburbSlug)))
    .orderBy(asc(branches.type), asc(branches.name));
}

// ===== ATM PAGE DATA =====

export async function getAtmsForSuburb(suburbSlug: string) {
  return db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      lat: branches.lat,
      lng: branches.lng,
      status: branches.status,
      feeRating: branches.feeRating,
      bankName: banks.name,
      bankSlug: banks.slug,
      suburbName: suburbs.name,
      postcode: suburbs.postcode,
      state: suburbs.state,
      stateSlug: suburbs.stateSlug,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(and(eq(suburbs.slug, suburbSlug), eq(branches.type, "atm")))
    .orderBy(asc(banks.name));
}

export async function getBanksByBranchCoverage(limit = 12) {
  return db
    .select({
      bankName: banks.name,
      bankSlug: banks.slug,
      bankType: banks.type,
      branchCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      suburbCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${suburbs.id} END)`,
      atmCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .groupBy(banks.id, banks.name, banks.slug, banks.type)
    .orderBy(
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'branch' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      asc(banks.name)
    )
    .limit(limit);
}

export async function getBanksByAtmCoverage(limit = 12) {
  return db
    .select({
      bankName: banks.name,
      bankSlug: banks.slug,
      bankType: banks.type,
      atmCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`,
      suburbCount: sql<number>`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${suburbs.id} END)`,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .where(eq(branches.type, "atm"))
    .groupBy(banks.id, banks.name, banks.slug, banks.type)
    .orderBy(
      desc(
        sql`count(DISTINCT CASE WHEN ${branches.type} = 'atm' AND ${branches.status} = 'open' THEN ${branches.id} END)`
      ),
      asc(banks.name)
    )
    .limit(limit);
}

// ===== COMPARISON DATA =====

export async function getBankComparisonData(bankSlug: string) {
  const bank = await getBankBySlug(bankSlug);
  if (!bank) return null;
  const stats = await getBankBranchStats(bank.id);
  const statePresence = await getBankStatesPresence(bank.id);
  return { bank, stats, stateCount: statePresence.length };
}

// ===== ALL BANK-STATE COMBOS =====

export async function getAllBankStateCombos() {
  return db
    .select({
      bankSlug: banks.slug,
      stateSlug: suburbs.stateSlug,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .groupBy(banks.slug, suburbs.stateSlug);
}

// ===== ALL BANK-STATE-SUBURB COMBOS =====

export async function getAllBankStateSuburbCombos() {
  return db
    .select({
      bankSlug: banks.slug,
      stateSlug: suburbs.stateSlug,
      suburbSlug: suburbs.slug,
    })
    .from(branches)
    .innerJoin(banks, eq(branches.bankId, banks.id))
    .innerJoin(suburbs, eq(branches.suburbId, suburbs.id))
    .groupBy(banks.slug, suburbs.stateSlug, suburbs.slug);
}
