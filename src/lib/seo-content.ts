
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
  const isBig4 = ["Commonwealth Bank", "ANZ", "Westpac", "NAB"].includes(bankName);
  
  const titles = {
    national: [
      `${bankName} Branches & ATM Locations Australia | Branch Tracker`,
      `Find ${bankName} Near Me - All ${stats.openBranches} Branch Locations`,
      `${bankName} Status: Are Branches Open Today? | Live Updates`
    ],
    state: [
      `${bankName} Branches in ${locationName} | Open Locations & ATMs`,
      `Find ${bankName} Near Me in ${locationName} - Branch Tracker`,
      `${bankName} ${locationName}: Branch Closures & Open Hours`
    ],
    suburb: [
      `${bankName} ${locationName} - Branch & ATM Status | Near Me`,
      `Is ${bankName} ${locationName} Open? Hours & Address`,
      `${bankName} Branch & ATM in ${locationName}, ${stats.openBranches > 0 ? 'Open Now' : 'Status'}`
    ]
  };

  const descriptions = {
    national: `Looking for a ${bankName} branch? We track all ${stats.openBranches} active ${bankName} locations across Australia. See opening hours, BSB numbers, and ATM status.`,
    state: `Find all ${stats.openBranches} ${bankName} branches and ATMs across ${locationName}. Get live status updates, addresses, and fee-free ATM locations in ${locationName}.`,
    suburb: `Find the nearest ${bankName} in ${locationName}. Check if the ${locationName} branch is open, find ${bankName} ATMs, and see recent status reports from the community.`
  };

  const intros = {
    national: `${bankName} operates a network of ${stats.openBranches} branches and ${stats.atms} ATMs across Australia. While many physical locations have closed recently, our tracker helps you find the nearest open ${bankName} branch with live status updates.`,
    state: `In ${locationName}, ${bankName} currently maintains ${stats.openBranches} active branch locations. Our community-driven tracker provides the most up-to-date information on ${bankName} status in ${locationName}, including recent closures and reduced hours.`,
    suburb: `${bankName} in ${locationName} serves the local community with banking services. Whether you need to visit a teller or find a fee-free ATM, we provide the latest details on the ${bankName} ${locationName} location.`
  };

  return {
    title: titles[type][0],
    description: descriptions[type],
    h1: `${bankName} Locations in ${locationName}`,
    intro: intros[type],
    faq: [
      {
        q: `How many ${bankName} branches are in ${locationName}?`,
        a: `There are currently ${stats.openBranches} active ${bankName} branches in ${locationName}.`
      },
      {
        q: `Where is the nearest ${bankName} ATM in ${locationName}?`,
        a: `You can find ${bankName} ATMs at our listed locations in ${locationName}. Most are available 24/7 for cash withdrawals.`
      }
    ]
  };
}

export function generateATMSEOContent(suburbName: string, atmCount: number): SEOContent {
  return {
    title: `Find Fee-Free ATMs in ${suburbName} | Near Me Status`,
    description: `Looking for an ATM in ${suburbName}? Find all ${atmCount} fee-free and major bank ATMs in ${suburbName}. Check live status and avoid "out of cash" machines.`,
    h1: `ATMs in ${suburbName}`,
    intro: `Finding a working ATM in ${suburbName} shouldn't be hard. We track ${atmCount} ATM locations across ${suburbName}, from Big 4 banks to independent operators, with live reports on cash availability.`,
    faq: [
      {
        q: `Which ATMs are fee-free in ${suburbName}?`,
        a: `Most major bank ATMs (CBA, Westpac, ANZ, NAB) are now fee-free for all Australian cardholders in ${suburbName}.`
      },
      {
        q: `Is there a 24-hour ATM in ${suburbName}?`,
        a: `Yes, most external bank ATMs in ${suburbName} offer 24/7 access for withdrawals and balance enquiries.`
      }
    ]
  };
}
