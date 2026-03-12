import type { MetadataRoute } from "next";
import { getCoreSitemap } from "@/lib/sitemap";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  return getCoreSitemap();
}
