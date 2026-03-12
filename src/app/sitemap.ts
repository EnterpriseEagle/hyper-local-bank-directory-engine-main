import type { MetadataRoute } from "next";
import { getCoreSitemap } from "@/lib/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return getCoreSitemap();
}
