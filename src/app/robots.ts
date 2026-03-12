import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getSitemapUrls } from "@/lib/sitemap";

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/admin/", "/health"];
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow,
      },
    ],
    host: siteUrl,
    sitemap: getSitemapUrls(),
  };
}
