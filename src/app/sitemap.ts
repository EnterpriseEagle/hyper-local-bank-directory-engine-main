
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
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${BASE_URL}/${s.stateSlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const suburbPages: MetadataRoute.Sitemap = suburbs.map((s) => ({
    url: `${BASE_URL}/${s.stateSlug}/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const atmPages: MetadataRoute.Sitemap = suburbs.map((s) => ({
    url: `${BASE_URL}/atm/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  const bankPages: MetadataRoute.Sitemap = banks.map((b) => ({
    url: `${BASE_URL}/bank/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const bankStatePages: MetadataRoute.Sitemap = bankStates.map((bs) => ({
    url: `${BASE_URL}/bank/${bs.bankSlug}/${bs.stateSlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const bankSuburbPages: MetadataRoute.Sitemap = bankSuburbs.map((bs) => ({
    url: `${BASE_URL}/bank/${bs.bankSlug}/${bs.stateSlug}/${bs.suburbSlug}`,
    lastModified: new Date(),
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
