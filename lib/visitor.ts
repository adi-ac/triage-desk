/**
 * Who a live-triage request is from, for the per-visitor limit: a hashed IP
 * and a signed cookie, both counted (lib/live-limits.ts). The raw IP is
 * never stored: only an HMAC of it, keyed by LIVE_TRIAGE_SECRET.
 *
 * The IP comes from the platform's header. On Vercel the platform sets
 * x-vercel-forwarded-for and x-real-ip itself, so a client can't choose
 * them. IPv6 counts by its /64 prefix: one device rotates its address
 * within it. With no IP header, every such request shares one bucket.
 */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE = "td_visitor";

/** A year: the cookie only needs to outlast a day, but a long one keeps a visitor's ID stable. */
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** The secret for the IP hash and the cookie signature, or null in production without one. */
export function visitorSecret(): string | null {
  const secret = process.env.LIVE_TRIAGE_SECRET;
  if (secret) return secret;
  return process.env.NODE_ENV === "production" ? null : "development-only-secret";
}

const hmac = (secret: string, value: string) => createHmac("sha256", secret).update(value).digest("base64url");

/** The client's IP from the platform header, IPv6 cut to its /64. */
export function clientIp(headers: Headers): string {
  const raw = headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip") ?? headers.get("x-forwarded-for") ?? "";
  const ip = raw.split(",")[0].trim().toLowerCase();
  if (!ip) return "unknown";
  if (!ip.includes(":") || ip.startsWith("::ffff:")) return ip;
  // Expand "::" so the first four groups are the /64.
  const [head, tail = ""] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : left;
  return `${groups.slice(0, 4).join(":")}::/64`;
}

/** Reads the signed cookie: its ID when the signature checks out, otherwise null. */
function readCookie(secret: string, value: string | undefined): string | null {
  if (!value) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;
  const expected = Buffer.from(hmac(secret, `cookie:${id}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}

/**
 * The visitor's IDs to count (the IP hash, and the cookie's ID), and the
 * Set-Cookie header to send when the cookie was missing or forged.
 */
export function identifyVisitor(
  secret: string,
  headers: Headers,
  cookie: string | undefined,
): { ids: string[]; setCookie: string | null } {
  const ipId = `ip:${hmac(secret, `ip:${clientIp(headers)}`).slice(0, 22)}`;
  let id = readCookie(secret, cookie);
  let setCookie: string | null = null;
  if (!id) {
    id = randomBytes(16).toString("base64url");
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    setCookie = `${VISITOR_COOKIE}=${id}.${hmac(secret, `cookie:${id}`)}; Path=/api/triage; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`;
  }
  return { ids: [ipId, `cookie:${id}`], setCookie };
}
