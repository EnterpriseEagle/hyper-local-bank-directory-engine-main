import type { MetadataRoute } from "next";
import { getInsightSitemap } from "@/lib/sitemap";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  return getInsightSitemap();
}
