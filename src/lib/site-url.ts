const DEFAULT_PRODUCTION_SITE_URL =
  "https://hyper-local-bank-directory-engine-main-production.up.railway.app";
const DEFAULT_DEVELOPMENT_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return normalizeSiteUrl(configuredUrl);
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return normalizeSiteUrl(railwayDomain);
  }

  return process.env.NODE_ENV === "production"
    ? DEFAULT_PRODUCTION_SITE_URL
    : DEFAULT_DEVELOPMENT_SITE_URL;
}

export const SITE_URL = getSiteUrl();
