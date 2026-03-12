/**
 * Affiliate offer configuration.
 * Replace placeholder URLs with your actual referral links.
 * Set `active: true` on the offer you want displayed.
 * The system picks the first active offer (priority order: ING > Ubank > Amex).
 */

export interface AffiliateOffer {
  id: string;
  active: boolean;
  brand: string;
  tagline: string;
  /** Shown above the card */
  badge: string;
  /** Three stat boxes */
  stats: { value: string; label: string }[];
  /** CTA button text */
  cta: string;
  /** Small print below CTA */
  finePrint: string;
  /** Affiliate referral URL — replace with your actual link */
  url: string;
  /** Colour scheme */
  theme: {
    accent: string; // tailwind text color
    accentBg: string; // tailwind bg for badge/glow
    buttonBg: string;
    buttonHover: string;
    buttonText: string;
    glowColor: string; // CSS color for radial glow
  };
  /** Payout control settings for agentic ops */
  ops: {
    network: string;
    contactEmail: string | null;
    paymentTermsDays: number;
    gracePeriodDays: number;
    pauseTrafficAfterDays: number;
    autoPauseOnDelinquency: boolean;
    fallbackOfferId: string | null;
  };
}

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  // PRIORITY 1 — ING ($125 campaign, toggle active when campaign is live)
  {
    id: "ing-125",
    active: false, // flip to true when ING campaign is live
    brand: "ING",
    tagline: "Get $125 just for switching.",
    badge: "Limited Time Offer",
    stats: [
      { value: "$0", label: "Monthly Fees" },
      { value: "5.35%", label: "Savings Rate" },
      { value: "100%", label: "ATM Fee Rebates" },
    ],
    cta: "Claim My $125 Bonus & Switch",
    finePrint:
      "Deposit $1k + make 5 purchases + open Savings Maximiser within 30 days. T&Cs apply.",
    url: "https://www.ing.com.au/referral-bonus", // Replace with your actual referral link
    theme: {
      accent: "text-orange-400",
      accentBg: "bg-orange-400/10",
      buttonBg: "bg-orange-500",
      buttonHover: "hover:bg-orange-400",
      buttonText: "text-black",
      glowColor: "rgba(249, 115, 22, 0.5)",
    },
    ops: {
      network: "direct",
      contactEmail: null,
      paymentTermsDays: 45,
      gracePeriodDays: 7,
      pauseTrafficAfterDays: 14,
      autoPauseOnDelinquency: true,
      fallbackOfferId: "ubank-30",
    },
  },

  // PRIORITY 2 — Ubank ($30, always-on)
  {
    id: "ubank-30",
    active: true,
    brand: "Ubank",
    tagline: "Australia's #1 Rated Digital Bank",
    badge: "Partner Offer",
    stats: [
      { value: "$0", label: "Monthly Fees" },
      { value: "5.50%", label: "Savings Rate" },
      { value: "100%", label: "ATM Fee Rebates" },
    ],
    cta: "Get My $30 Bonus & Switch",
    finePrint:
      "No obligations. Takes 5 minutes. Keep your old account open.",
    url: "https://www.ubank.com.au/referral", // Replace with your actual referral link
    theme: {
      accent: "text-amber-400",
      accentBg: "bg-amber-400/10",
      buttonBg: "bg-amber-400",
      buttonHover: "hover:bg-amber-300",
      buttonText: "text-black",
      glowColor: "rgba(234, 179, 8, 0.5)",
    },
    ops: {
      network: "direct",
      contactEmail: null,
      paymentTermsDays: 30,
      gracePeriodDays: 7,
      pauseTrafficAfterDays: 14,
      autoPauseOnDelinquency: true,
      fallbackOfferId: "ing-125",
    },
  },

  // PRIORITY 3 — Amex (credit card, higher value per conversion)
  {
    id: "amex-platinum",
    active: false, // flip to true when Amex affiliate is approved
    brand: "American Express",
    tagline: "The Card That Pays You Back",
    badge: "Premium Partner",
    stats: [
      { value: "3x", label: "Points on Travel" },
      { value: "$450", label: "Travel Credit" },
      { value: "Lounge", label: "Airport Access" },
    ],
    cta: "Apply for Amex Platinum",
    finePrint:
      "Subject to approval. Annual fee applies. T&Cs at americanexpress.com.au.",
    url: "https://www.americanexpress.com/au/referral", // Replace with your actual referral link
    theme: {
      accent: "text-blue-400",
      accentBg: "bg-blue-400/10",
      buttonBg: "bg-blue-500",
      buttonHover: "hover:bg-blue-400",
      buttonText: "text-white",
      glowColor: "rgba(59, 130, 246, 0.5)",
    },
    ops: {
      network: "direct",
      contactEmail: null,
      paymentTermsDays: 45,
      gracePeriodDays: 10,
      pauseTrafficAfterDays: 21,
      autoPauseOnDelinquency: true,
      fallbackOfferId: "ubank-30",
    },
  },
];

export function getAffiliateOfferById(offerId: string): AffiliateOffer | null {
  return AFFILIATE_OFFERS.find((offer) => offer.id === offerId) ?? null;
}

export function getFallbackOffer(excludeOfferId?: string | null): AffiliateOffer {
  if (excludeOfferId) {
    const preferredFallbackId = getAffiliateOfferById(excludeOfferId)?.ops.fallbackOfferId;
    const preferredFallback = preferredFallbackId
      ? getAffiliateOfferById(preferredFallbackId)
      : null;

    if (preferredFallback) {
      return preferredFallback;
    }
  }

  const nextActive = AFFILIATE_OFFERS.find(
    (offer) => offer.active && offer.id !== excludeOfferId
  );
  return nextActive ?? AFFILIATE_OFFERS.find((offer) => offer.id === "ubank-30")!;
}

/** Returns the highest-priority active offer, or the Ubank fallback */
export function getActiveOffer(): AffiliateOffer {
  const active = AFFILIATE_OFFERS.find((o) => o.active);
  // Fallback to Ubank if nothing is active
  return active ?? AFFILIATE_OFFERS.find((o) => o.id === "ubank-30")!;
}
