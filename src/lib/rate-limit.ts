/**
 * Simple in-memory rate limiter.
 * Resets on server restart. Good enough for basic abuse prevention.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true;
  }

  return false;
}

/** Get anonymized IP hash from request */
export function getIpHash(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  // Use a simple hash, not reversible base64
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
