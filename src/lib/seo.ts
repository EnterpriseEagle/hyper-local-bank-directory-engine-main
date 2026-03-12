import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";

export const SITE_NAME = "BANK NEAR ME";
export const SITE_LEGAL_NAME = "BANK NEAR ME®";
export const SITE_DESCRIPTION =
  "Australia's crowd-sourced bank status tracker for branches, ATMs, outages, closures, and live queue reports across thousands of suburbs.";
export const SITE_LOCALE = "en_AU";
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export const DEFAULT_KEYWORDS = [
  "bank near me Australia",
  "Australian bank branches",
  "bank branch closures Australia",
  "ATM near me",
  "ATM status Australia",
  "live bank status",
  "bank outage tracker",
  "bank branches by suburb",
  "Australian ATM finder",
  "bank closures tracker",
  "Commonwealth Bank branches",
  "Westpac branches",
  "ANZ branches",
  "NAB branches",
];

const DEFAULT_ROBOTS = {
  index: true,
  follow: true,
  nocache: false,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} satisfies NonNullable<Metadata["robots"]>;

const NOINDEX_ROBOTS = {
  index: false,
  follow: true,
  nocache: false,
  googleBot: {
    index: false,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} satisfies NonNullable<Metadata["robots"]>;

export type JsonLd = Record<string, unknown>;

interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  keywords?: string[];
  imagePath?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  category?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}

export function absoluteUrl(path = "/") {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return new URL(pathname, getSiteUrl()).toString();
}

export function buildKeywords(keywords: string[] = []) {
  return Array.from(new Set([...DEFAULT_KEYWORDS, ...keywords]));
}

export function buildMetadata({
  title,
  description,
  path,
  canonicalPath,
  keywords = [],
  imagePath = DEFAULT_OG_IMAGE_PATH,
  imageAlt,
  type = "website",
  noIndex = false,
  category = "finance",
  openGraphTitle,
  openGraphDescription,
  twitterTitle,
  twitterDescription,
  publishedTime,
  modifiedTime,
  section,
}: MetadataOptions): Metadata {
  const canonical = absoluteUrl(canonicalPath ?? path);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    keywords: buildKeywords(keywords),
    category,
    robots: noIndex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS,
    openGraph: {
      type,
      locale: SITE_LOCALE,
      url: canonical,
      siteName: SITE_LEGAL_NAME,
      title: openGraphTitle ?? title,
      description: openGraphDescription ?? description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(section ? { section } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle ?? title,
      description: twitterDescription ?? description,
      images: [imageUrl],
    },
    other: {
      "geo.region": "AU",
      "geo.placename": "Australia",
      "geo.position": "-25.2744;133.7751",
      ICBM: "-25.2744, 133.7751",
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFAQSchema(
  faq: Array<{ q: string; a: string }>
): JsonLd | null {
  if (faq.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildItemListSchema(
  name: string,
  items: Array<{ name: string; url: string; description?: string }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function buildCollectionPageSchema(input: {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  about?: JsonLd;
  mainEntity?: JsonLd;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: "en-AU",
    isPartOf: {
      "@id": absoluteUrl("/#website"),
    },
    mainEntityOfPage: input.url,
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    ...(typeof input.numberOfItems === "number"
      ? { numberOfItems: input.numberOfItems }
      : {}),
    ...(input.about ? { about: input.about } : {}),
    ...(input.mainEntity ? { mainEntity: input.mainEntity } : {}),
  };
}

export function buildWebPageSchema(input: {
  name: string;
  description: string;
  url: string;
  about?: JsonLd;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: "en-AU",
    isPartOf: {
      "@id": absoluteUrl("/#website"),
    },
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    primaryImageOfPage: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    ...(input.about ? { about: input.about } : {}),
  };
}

export function buildOrganizationSchema(): JsonLd {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_LEGAL_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/icon.svg"),
    areaServed: {
      "@type": "Country",
      name: "Australia",
    },
    knowsAbout: [
      "Australian bank branches",
      "ATM locations",
      "Bank branch closures",
      "Bank outage reports",
      "Local branch status",
    ],
  };
}

export function buildWebSiteSchema(): JsonLd {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_LEGAL_NAME,
    alternateName: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "en-AU",
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
