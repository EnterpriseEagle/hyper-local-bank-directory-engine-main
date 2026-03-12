import type { MetadataRoute } from "next";
import { getAtmSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getAtmSitemap();
}
