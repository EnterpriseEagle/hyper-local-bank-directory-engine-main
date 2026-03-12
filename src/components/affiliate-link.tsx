"use client";

import { ReactNode } from "react";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

interface AffiliateLinkProps {
  href: string;
  offerId: string;
  placement: string;
  suburbSlug?: string;
  stateSlug?: string;
  className?: string;
  children: ReactNode;
}

export function AffiliateLink({
  href,
  offerId,
  placement,
  suburbSlug,
  stateSlug,
  className,
  children,
}: AffiliateLinkProps) {
  function handleClick() {
    if (!affiliateFeaturesEnabled) {
      return;
    }

    // Fire GA event
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", {
        offer_id: offerId,
        placement,
        url: href,
      });
    }

    // Fire server-side tracking (fire-and-forget, don't block navigation)
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId,
        placement,
        pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
        suburbSlug,
        stateSlug,
      }),
      keepalive: true, // ensures request completes even as page navigates away
    }).catch(() => {}); // silently fail - don't block the user
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

// Extend Window type for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
