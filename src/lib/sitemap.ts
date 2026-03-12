import type { MetadataRoute } from "next";
import {
  getAllBankStateCombos,
  getAllBankStateSuburbCombos,
  getAllBanks,
  getAllSuburbSlugs,
  getStateList,
} from "./data";
import { getSiteUrl } from "./site-url";

type SitemapEntry = MetadataRoute.Sitemap[number];

export const SITEMAP_PATHS = {
  core: "/sitemap.xml",
  states: "/sitemaps/states/sitemap.xml",
  suburbs: "/sitemaps/suburbs/sitemap.xml",
  atms: "/sitemaps/atms/sitemap.xml",
  banks: "/sitemaps/banks/sitemap.xml",
  bankStates: "/sitemaps/bank-states/sitemap.xml",
  bankSuburbs: "/sitemaps/bank-suburbs/sitemap.xml",
} as const;

function buildEntry(
  path: string,
  changeFrequency: SitemapEntry["changeFrequency"],
  priority: number,
  lastModified = new Date()
): SitemapEntry {
  const baseUrl = getSiteUrl();

  return {
    url: path === "/" ? baseUrl : `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}

export function getSitemapUrls() {
  return Object.values(SITEMAP_PATHS).map((path) => buildEntry(path, "daily", 0.5).url);
}

export function getCoreSitemap(lastModified = new Date()): MetadataRoute.Sitemap {
  return [
    buildEntry("/", "daily", 1, lastModified),
    buildEntry("/bank-near-me", "weekly", 0.9, lastModified),
    buildEntry("/atm-near-me", "weekly", 0.9, lastModified),
    buildEntry("/cba-near-me", "weekly", 0.9, lastModified),
    buildEntry("/bank", "weekly", 0.85, lastModified),
    buildEntry("/closures", "daily", 0.8, lastModified),
    buildEntry("/search", "monthly", 0.3, lastModified),
  ];
}

export async function getStateSitemap(lastModified = new Date()): Promise<MetadataRoute.Sitemap> {
  const states = await getStateList();

  return states.map((state) =>
    buildEntry(`/${state.stateSlug}`, "weekly", 0.8, lastModified)
  );
}

export async function getSuburbSitemap(
  lastModified = new Date()
): Promise<MetadataRoute.Sitemap> {
  const suburbs = await getAllSuburbSlugs();

  return suburbs.map((suburb) =>
    buildEntry(`/${suburb.stateSlug}/${suburb.slug}`, "daily", 0.6, lastModified)
  );
}

export async function getAtmSitemap(lastModified = new Date()): Promise<MetadataRoute.Sitemap> {
  const suburbs = await getAllSuburbSlugs();

  return suburbs.map((suburb) =>
    buildEntry(`/atm/${suburb.slug}`, "daily", 0.5, lastModified)
  );
}

export async function getBankSitemap(lastModified = new Date()): Promise<MetadataRoute.Sitemap> {
  const banks = await getAllBanks();

  return banks.map((bank) =>
    buildEntry(`/bank/${bank.slug}`, "weekly", 0.7, lastModified)
  );
}

export async function getBankStateSitemap(
  lastModified = new Date()
): Promise<MetadataRoute.Sitemap> {
  const bankStates = await getAllBankStateCombos();

  return bankStates.map((bankState) =>
    buildEntry(
      `/bank/${bankState.bankSlug}/${bankState.stateSlug}`,
      "weekly",
      0.6,
      lastModified
    )
  );
}

export async function getBankSuburbSitemap(
  lastModified = new Date()
): Promise<MetadataRoute.Sitemap> {
  const bankSuburbs = await getAllBankStateSuburbCombos();

  return bankSuburbs.map((bankSuburb) =>
    buildEntry(
      `/bank/${bankSuburb.bankSlug}/${bankSuburb.stateSlug}/${bankSuburb.suburbSlug}`,
      "daily",
      0.5,
      lastModified
    )
  );
}
