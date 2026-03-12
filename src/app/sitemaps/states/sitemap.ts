import type { MetadataRoute } from "next";
import { getStateSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getStateSitemap();
}
