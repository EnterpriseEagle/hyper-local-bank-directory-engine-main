export interface SearchRouteResult {
  name: string;
  postcode: string;
  state: string;
  slug: string;
  stateSlug: string;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findDirectSearchMatch(
  query: string,
  results: SearchRouteResult[]
) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery || results.length === 0) {
    return null;
  }

  const exactMatches = results.filter((result) => {
    const suburb = normalizeSearchValue(result.name);
    const postcode = normalizeSearchValue(result.postcode);
    const suburbWithPostcode = normalizeSearchValue(
      `${result.name} ${result.postcode}`
    );

    return (
      normalizedQuery === suburb ||
      normalizedQuery === postcode ||
      normalizedQuery === suburbWithPostcode
    );
  });

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (results.length === 1) {
    const [onlyResult] = results;
    const suburb = normalizeSearchValue(onlyResult.name);
    const postcode = normalizeSearchValue(onlyResult.postcode);

    if (
      suburb.startsWith(normalizedQuery) ||
      postcode.startsWith(normalizedQuery)
    ) {
      return onlyResult;
    }
  }

  return null;
}
