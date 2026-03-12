
export interface SEOContent {
  title: string;
  description: string;
  h1: string;
  intro: string;
  faq: { q: string; a: string }[];
}

export function generateBankSEOContent(
  bankName: string,
  locationName: string,
  type: "state" | "suburb" | "national",
  stats: { openBranches: number; atms: number; closedBranches: number }
): SEOContent {
  const titles = {
    national: [
      `${bankName} Branches, ATMs & Closures in Australia | Live Tracker`,
      `${bankName} Near Me Australia | ${stats.openBranches} Branches and ${stats.atms} ATMs`,
      `${bankName} Australia Status | Branch Locations, Closures and ATM Finder`,
    ],
    state: [
      `${bankName} Branches and ATMs in ${locationName} | Live Locations`,
      `${bankName} Near Me in ${locationName} | Open Branches, ATMs and Closures`,
      `${bankName} ${locationName} Status | Hours, Addresses and ATM Finder`,
    ],
    suburb: [
      `${bankName} in ${locationName} | Branch, ATM and Live Status`,
      `Is ${bankName} Open in ${locationName}? Branch Hours, Address and ATM Info`,
      `${bankName} ${locationName} Near Me | ${stats.openBranches} Branches and ${stats.atms} ATMs`,
    ],
  };

  const descriptions = {
    national: `Track ${bankName} across Australia with ${stats.openBranches} open branches, ${stats.atms} ATMs, and ${stats.closedBranches} recent closures. Find addresses, branch details, ATM access, and live local status reports.`,
    state: `Find ${stats.openBranches} ${bankName} branches and ${stats.atms} ATMs across ${locationName}. Check open locations, branch closures, addresses, and recent community status reports before you visit.`,
    suburb: `Find the nearest ${bankName} in ${locationName}. Check branch hours, ATM access, recent closures, and live community reports before you leave home.`
  };

  const intros = {
    national: `${bankName} operates ${stats.openBranches} open branches and ${stats.atms} ATMs across Australia. We surface network coverage, known closures, and local status signals so people can find a working ${bankName} location faster.`,
    state: `${bankName} currently maintains ${stats.openBranches} open branches and ${stats.atms} ATMs in ${locationName}. This page tracks the bank's footprint in the state, including recent closures and location-level discovery data.`,
    suburb: `${bankName} in ${locationName} serves the local community with branch access, ATMs, and day-to-day banking services. This page pulls together local location data and fresh community status reports in one place.`
  };

  const locationLabel =
    type === "national" ? "Australia" : locationName;

  return {
    title: titles[type][0],
    description: descriptions[type],
    h1:
      type === "national"
        ? `${bankName} Locations in Australia`
        : `${bankName} Locations in ${locationName}`,
    intro: intros[type],
    faq: [
      {
        q: `How many ${bankName} branches are in ${locationLabel}?`,
        a: `${bankName} currently has ${stats.openBranches} open branch${stats.openBranches === 1 ? "" : "es"} tracked in ${locationLabel}.`
      },
      {
        q: `How many ${bankName} ATMs are listed for ${locationLabel}?`,
        a: `We currently track ${stats.atms} ${bankName} ATM location${stats.atms === 1 ? "" : "s"} in ${locationLabel}, alongside branch-level coverage and closure data.`
      },
      {
        q: `How do I check whether a ${bankName} branch is still open in ${locationLabel}?`,
        a: `Use the location listings on this page to review open branches, recent closures, addresses, and any live status reports submitted by the community before you visit.`
      },
    ],
  };
}

export function generateATMSEOContent(suburbName: string, atmCount: number): SEOContent {
  return {
    title: `ATMs in ${suburbName} | Fee-Free, Major Banks and Live Status`,
    description: `Looking for an ATM in ${suburbName}? Find ${atmCount} ATM locations, compare major bank options, and check live local status reports before you head out.`,
    h1: `ATMs in ${suburbName}`,
    intro: `Finding a working ATM in ${suburbName} should be fast. We track ${atmCount} ATM locations across ${suburbName}, from major Australian banks to independent operators, with live local reporting on availability and issues.`,
    faq: [
      {
        q: `Which ATMs are fee-free in ${suburbName}?`,
        a: `Many major bank ATMs in ${suburbName}, including Commonwealth Bank, Westpac, ANZ, and NAB, are fee-free for most Australian cardholders. Check each listed ATM for the provider and location details.`
      },
      {
        q: `Is there a 24-hour ATM in ${suburbName}?`,
        a: `Many external bank ATMs in ${suburbName} are available 24/7, but access can depend on whether the machine sits inside a branch foyer, shopping centre, or other restricted site.`
      },
      {
        q: `How do I avoid empty or offline ATMs in ${suburbName}?`,
        a: `Use the ATM listings and recent live reports on this page to spot cash outages, machine issues, and nearby alternatives before you make the trip.`
      },
    ],
  };
}
