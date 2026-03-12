import type { MetadataRoute } from "next";
import { getBankSuburbSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getBankSuburbSitemap();
}
