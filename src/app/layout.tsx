import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { MobileNav } from "@/components/mobile-nav";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
    title: {
      default: "BANK NEAR ME\u00ae - Is Your Bank Actually Working? Live ATM & Branch Status",
      template: "%s | BANK NEAR ME\u00ae",
    },
      description:
        "Australia's crowd-sourced bank status tracker. Report ATM outages, branch closures, and long queues in real-time across 15,000+ suburbs. DownDetector for banks.",
    metadataBase: new URL(SITE_URL),
    openGraph: {
      type: "website",
      locale: "en_AU",
      siteName: "BANK NEAR ME\u00ae",
      title: "BANK NEAR ME\u00ae - Is Your Bank Actually Working?",
      description:
        "Australia's crowd-sourced bank status tracker. Live ATM outages, branch closures, and queue reports across 15,000+ suburbs.",
    },
    twitter: {
      card: "summary_large_image",
      title: "BANK NEAR ME\u00ae - Live Bank Status Tracker",
      description:
        "Live crowd-sourced status for Australian banks. Report ATM outages and branch closures across 15,000+ suburbs.",
    },
  keywords: [
    "bank branches Australia",
    "ATM near me",
    "ATM out of cash",
    "bank branch closed",
    "bank closures Australia",
    "find bank",
    "bank status",
    "ATM empty",
    "Commonwealth Bank branch",
    "Westpac branch",
    "ANZ branch",
    "NAB branch",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white min-h-screen flex flex-col">
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
          <div className="mx-auto max-w-[1000px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
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
