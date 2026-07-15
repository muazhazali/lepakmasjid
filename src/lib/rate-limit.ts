/**
 * Client-side rate limiting utility
 *
 * NOTE: This is defense-in-depth only. Client-side rate limiting can be bypassed.
 * Server-side rate limiting MUST be implemented at PocketBase level or via reverse proxy (Cloudflare, nginx).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Checks if an action is allowed based on rate limiting rules
 * @param key - Unique identifier for the rate limit (e.g., 'login:user@example.com')
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No record or window expired - reset
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= maxAttempts) {
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

/**
 * Resets rate limit for a key (e.g., on successful authentication)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Gets remaining attempts for a key
 */
export function getRemainingAttempts(
  key: string,
  maxAttempts: number = 5
): number {
  const record = rateLimitStore.get(key);
  if (!record) {
    return maxAttempts;
  }

  const now = Date.now();
  if (now > record.resetAt) {
    return maxAttempts;
  }

  return Math.max(0, maxAttempts - record.count);
}

/**
 * Gets time until rate limit resets (in milliseconds)
 */
export function getResetTime(key: string): number | null {
  const record = rateLimitStore.get(key);
  if (!record) {
    return null;
  }

  const now = Date.now();
  if (now > record.resetAt) {
    return null;
  }

  return record.resetAt - now;
}
