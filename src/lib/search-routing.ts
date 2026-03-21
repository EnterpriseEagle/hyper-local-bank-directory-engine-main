export interface SearchRouteResult {
  kind: "suburb" | "bank";
  name: string;
  slug: string;
  href: string;
  subtitle: string;
  postcode?: string;
  state?: string;
  stateSlug?: string;
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function getDirectMatchCandidates(result: SearchRouteResult) {
  const candidates = [
    normalizeSearchValue(result.name),
    normalizeSearchValue(result.slug.replace(/-/g, " ")),
  ];

  if (result.kind === "suburb" && result.postcode) {
    candidates.push(normalizeSearchValue(result.postcode));
    candidates.push(normalizeSearchValue(`${result.name} ${result.postcode}`));
  }

  return candidates.filter(Boolean);
}

export function findDirectSearchMatch(
  query: string,
  results: SearchRouteResult[]
) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery || results.length === 0) {
    return null;
  }

  const exactMatches = results.filter((result) =>
    getDirectMatchCandidates(result).some(
      (candidate) => candidate === normalizedQuery
    )
  );

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (results.length === 1) {
    const [onlyResult] = results;
    const directCandidates = getDirectMatchCandidates(onlyResult);

    if (directCandidates.some((candidate) => candidate.startsWith(normalizedQuery))) {
      return onlyResult;
    }
  }

  return null;
}
