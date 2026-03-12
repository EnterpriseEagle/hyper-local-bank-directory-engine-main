import type { MetadataRoute } from "next";
import { getBankStateSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getBankStateSitemap();
}
