import type { MetadataRoute } from "next";
import { getBankSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getBankSitemap();
}
