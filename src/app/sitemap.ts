
import type { MetadataRoute } from "next";
import { 
  getAllSuburbSlugs, 
  getStateList, 
  getAllBanks, 
  getAllBankStateCombos, 
  getAllBankStateSuburbCombos 
} from "@/lib/data";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
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
      url: baseUrl,
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/bank`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/closures`,
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bank-near-me`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/atm-near-me`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${baseUrl}/${s.stateSlug}`,
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const suburbPages: MetadataRoute.Sitemap = suburbs.map((s) => ({
    url: `${baseUrl}/${s.stateSlug}/${s.slug}`,
    lastModified: generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const atmPages: MetadataRoute.Sitemap = suburbs.map((s) => ({
    url: `${baseUrl}/atm/${s.slug}`,
    lastModified: generatedAt,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  const bankPages: MetadataRoute.Sitemap = banks.map((b) => ({
    url: `${baseUrl}/bank/${b.slug}`,
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const bankStatePages: MetadataRoute.Sitemap = bankStates.map((bs) => ({
    url: `${baseUrl}/bank/${bs.bankSlug}/${bs.stateSlug}`,
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const bankSuburbPages: MetadataRoute.Sitemap = bankSuburbs.map((bs) => ({
    url: `${baseUrl}/bank/${bs.bankSlug}/${bs.stateSlug}/${bs.suburbSlug}`,
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
