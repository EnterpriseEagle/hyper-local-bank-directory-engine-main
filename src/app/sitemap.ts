
import type { MetadataRoute } from "next";
import { 
  getAllSuburbSlugs, 
  getStateList, 
  getAllBanks, 
  getAllBankStateCombos, 
  getAllBankStateSuburbCombos 
} from "@/lib/data";
import { SITE_URL } from "@/lib/site-url";

const BASE_URL = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const [
    suburbs, 
    states, 
    banks, 
    bankStates, 
    bankSuburbs
  ] = await Promise.all([
    getAllSuburbSlugs(),
    getStateList(),
    getAllBanks(),
    getAllBankStateCombos(),
    getAllBankStateSuburbCombos(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/bank`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/closures`,
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/bank-near-me`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/atm-near-me`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${BASE_URL}/${s.stateSlug}`,
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const suburbPages: MetadataRoute.Sitemap = suburbs.map((s) => ({
    url: `${BASE_URL}/${s.stateSlug}/${s.slug}`,
    lastModified: generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const atmPages: MetadataRoute.Sitemap = suburbs.map((s) => ({
    url: `${BASE_URL}/atm/${s.slug}`,
    lastModified: generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  const bankPages: MetadataRoute.Sitemap = banks.map((b) => ({
    url: `${BASE_URL}/bank/${b.slug}`,
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const bankStatePages: MetadataRoute.Sitemap = bankStates.map((bs) => ({
    url: `${BASE_URL}/bank/${bs.bankSlug}/${bs.stateSlug}`,
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const bankSuburbPages: MetadataRoute.Sitemap = bankSuburbs.map((bs) => ({
    url: `${BASE_URL}/bank/${bs.bankSlug}/${bs.stateSlug}/${bs.suburbSlug}`,
    lastModified: generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages, 
    ...statePages, 
    ...suburbPages, 
    ...atmPages, 
    ...bankPages, 
    ...bankStatePages, 
    ...bankSuburbPages
  ];
}
