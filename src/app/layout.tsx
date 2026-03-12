import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { MobileNav } from "@/components/mobile-nav";
import { SITE_URL } from "@/lib/site-url";
import {
  DEFAULT_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
  absoluteUrl,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_LEGAL_NAME,
    template: "%s | BANK NEAR ME®",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_LEGAL_NAME }],
  creator: SITE_LEGAL_NAME,
  publisher: SITE_LEGAL_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  manifest: absoluteUrl("/manifest.webmanifest"),
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.ico" }],
  },
  alternates: {
    types: {
      "application/rss+xml": absoluteUrl("/feed.xml"),
      "text/plain": absoluteUrl("/llms.txt"),
    },
  },
  keywords: DEFAULT_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: SITE_LEGAL_NAME,
    title: `${SITE_LEGAL_NAME} - Live Bank Branch and ATM Status Across Australia`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_LEGAL_NAME} - Live Bank Status Tracker`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_LEGAL_NAME} - Live Bank Status Tracker`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/opengraph-image")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "commission-factory-verification": "632a548d09944472a61b9ee7f3157f9d",
    "geo.region": "AU",
    "geo.placename": "Australia",
    "geo.position": "-25.2744;133.7751",
    ICBM: "-25.2744, 133.7751",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="antialiased bg-black text-white min-h-screen flex flex-col">
        <StructuredData
          data={[buildOrganizationSchema(), buildWebSiteSchema()]}
        />
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="518c7fc1-9b6b-4c3b-9b96-b06b512bcf6c"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />

        {/* Google Analytics — set NEXT_PUBLIC_GA_ID env var to enable */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Navigation - Fixed glassmorphism nav */}
        <nav className="fixed left-0 right-0 top-0 z-50">
          <div
            className="absolute inset-0 backdrop-blur-[32px] backdrop-saturate-150"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="relative mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 sm:px-10">
            <Link href="/" className="group transition-opacity hover:opacity-70 flex items-center gap-2">
                <span className="font-sans text-[13px] font-bold uppercase tracking-[0.15em] text-white">
                  BANK NEAR ME<sup className="text-[7px] relative -top-1">®</sup>
                </span>
              </Link>

            <div className="hidden md:block flex-1 max-w-xs mx-8">
              <SearchBar />
            </div>

              <MobileNav />
            </div>
        </nav>

        {/* Main content - offset for fixed nav */}
        <main className="flex-1 pt-[80px]">{children}</main>

        {/* Footer - Minimal dark footer */}
        <footer className="border-t border-white/5 bg-black px-6 py-12 sm:px-10 mt-auto">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
              <div>
                <span className="font-sans text-[13px] font-bold uppercase tracking-[0.15em] text-white">BANK NEAR ME<sup className="text-[7px]">®</sup></span>
                <p className="mt-3 text-[13px] leading-relaxed text-white/30">
                  Australia&apos;s comprehensive database of bank branches, ATMs, and banking services.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 mb-4">
                  Browse by State
                </p>
                <ul className="space-y-2">
                  {[
                    ["New South Wales", "new-south-wales"],
                    ["Victoria", "victoria"],
                    ["Queensland", "queensland"],
                    ["Western Australia", "western-australia"],
                  ].map(([name, slug]) => (
                    <li key={slug}>
                      <Link
                        href={`/${slug}`}
                        className="text-[12px] text-white/30 transition-colors duration-300 hover:text-white underline-reveal"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 mb-4">
                  More States
                </p>
                <ul className="space-y-2">
                  {[
                    ["South Australia", "south-australia"],
                    ["Tasmania", "tasmania"],
                    ["Northern Territory", "northern-territory"],
                    ["ACT", "australian-capital-territory"],
                  ].map(([name, slug]) => (
                    <li key={slug}>
                      <Link
                        href={`/${slug}`}
                        className="text-[12px] text-white/30 transition-colors duration-300 hover:text-white underline-reveal"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 mb-4">
                    Popular Banks
                  </p>
                  <ul className="space-y-2">
                    {[
                      ["Commonwealth Bank", "commonwealth-bank"],
                      ["Westpac", "westpac"],
                      ["ANZ", "anz"],
                      ["NAB", "nab"],
                      ["Bendigo Bank", "bendigo-bank"],
                    ].map(([name, slug]) => (
                      <li key={slug}>
                        <Link
                          href={`/bank/${slug}`}
                          className="text-[12px] text-white/30 transition-colors duration-300 hover:text-white underline-reveal"
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50 mb-4">
                    Popular Searches
                  </p>
                  <ul className="space-y-2">
                    {[
                      ["Bank Near Me", "/bank-near-me"],
                      ["ATM Near Me", "/atm-near-me"],
                      ["Bank Closures", "/closures"],
                      ["Search All Suburbs", "/search"],
                      ["Browse All Banks", "/bank"],
                    ].map(([name, href]) => (
                      <li key={href}>
                        <Link
                          href={href}
                          className="text-[12px] text-white/30 transition-colors duration-300 hover:text-white underline-reveal"
                        >
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
            </div>

            <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/20">
                  BANK NEAR ME&reg;
                </p>
              <div className="flex items-center gap-6 text-[11px] text-white/20">
                <span>&copy; {new Date().getFullYear()}</span>
                <span>Data sourced from publicly available banking information</span>
              </div>
            </div>
          </div>
        </footer>

        {children && null}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
