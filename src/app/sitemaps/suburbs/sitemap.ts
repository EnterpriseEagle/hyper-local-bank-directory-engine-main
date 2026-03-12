import type { MetadataRoute } from "next";
import { getSuburbSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSuburbSitemap();
}
