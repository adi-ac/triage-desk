/**
 * The limits on live triage (docs/brief.md, "Live triage"): a number of
 * triages per visitor per UTC day, and a daily spend cap across everyone.
 * Pure logic over a small counter store, so tests can run it with a fake
 * store and a fake clock. lib/live-store.ts supplies the real store.
 *
 * Both limits are counters that only move by atomic increments. A request
 * adds itself first and backs out if that took a counter past its limit, so
 * concurrent requests can never overshoot: at worst, two that race at the
 * edge are both turned away.
 */

import "server-only";

/** A counter store: one atomic operation, increment by an amount (which may be negative). */
export type CounterStore = {
  /**
   * Adds `by` to the integer at `key` (missing counts as 0) and returns the
   * new value. The key expires at `expiresAt` (ms since the epoch), so a
   * day's counters clean themselves up.
   */
  incrBy(key: string, by: number, expiresAt: number): Promise<number>;
};

export type Clock = () => number;

const DAY = 24 * 60 * 60 * 1000;

/** The UTC day, as "2026-11-08": every counter is per day. */
export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** When today's limits reset: the next UTC midnight. */
export function nextUtcMidnight(now: number): number {
  return Math.floor(now / DAY) * DAY + DAY;
}

/** Counters outlive their day by an hour, so a request settling just after midnight still finds its key. */
const expiry = (now: number) => nextUtcMidnight(now) + 60 * 60 * 1000;

export type Refused = { ok: false; resetsAt: string };

/**
 * Takes one of today's triages for a visitor. A visitor is several IDs (a
 * hashed IP and a cookie, lib/visitor.ts), each with its own counter, and
 * every one must be under the limit: clearing the cookie doesn't reset the
 * IP's count, and an IP that changes doesn't reset the cookie's. On a
 * refusal, nothing stays counted. release() gives the triage back (when the
 * model failed, so the visitor isn't charged for our error).
 */
export async function takeVisitorTriage(
  store: CounterStore,
  ids: readonly string[],
  limit: number,
  now: number,
): Promise<{ ok: true; release: () => Promise<void> } | Refused> {
  const day = utcDay(now);
  const keys = ids.map((id) => `triage:visitor:${day}:${id}`);
  const counts = await Promise.all(keys.map((key) => store.incrBy(key, 1, expiry(now))));
  const back = () => Promise.all(keys.map((key) => store.incrBy(key, -1, expiry(now)))).then(() => undefined);
  if (counts.some((count) => count > limit)) {
    await back();
    return { ok: false, resetsAt: new Date(nextUtcMidnight(now)).toISOString() };
  }
  return { ok: true, release: back };
}

/** Dollars as whole micro-dollars, so the counters stay integers. */
const micros = (usd: number) => Math.ceil(usd * 1_000_000);

/**
 * Reserves one model call's worst-case cost against today's spend cap
 * (before the call), then settles it to what the call actually cost (after).
 * A reservation that would take the day past the cap is backed out and
 * refused. Settling only ever lowers the total (the actual cost is at most
 * the worst case), so the day never ends above the cap.
 */
export async function reserveSpend(
  store: CounterStore,
  worstCaseUsd: number,
  capUsd: number,
  now: number,
): Promise<{ ok: true; settle: (actualUsd: number) => Promise<void> } | Refused> {
  const key = `triage:spend:${utcDay(now)}`;
  const reserved = micros(worstCaseUsd);
  const total = await store.incrBy(key, reserved, expiry(now));
  if (total > micros(capUsd)) {
    await store.incrBy(key, -reserved, expiry(now));
    return { ok: false, resetsAt: new Date(nextUtcMidnight(now)).toISOString() };
  }
  let settled = false;
  return {
    ok: true,
    settle: async (actualUsd) => {
      if (settled) return;
      settled = true;
      // Never more than was reserved: the reservation is the bound.
      const delta = Math.min(micros(actualUsd), reserved) - reserved;
      if (delta !== 0) await store.incrBy(key, delta, expiry(now));
    },
  };
}

/** Today's spend so far, in dollars (reservations included). For tests and checks. */
export async function spentToday(store: CounterStore, now: number): Promise<number> {
  return (await store.incrBy(`triage:spend:${utcDay(now)}`, 0, expiry(now))) / 1_000_000;
}

/** $ per million tokens. */
export type Price = { input: number; output: number };

/**
 * The most one call can cost. Input: every token is at least one byte of
 * UTF-8, so the request's bytes bound its input tokens; `overheadTokens`
 * covers what the API adds around them (role markers, the output format).
 * Output: max_tokens, thinking included.
 */
export function worstCaseCost(price: Price, inputBytes: number, overheadTokens: number, maxTokens: number): number {
  return ((inputBytes + overheadTokens) * price.input + maxTokens * price.output) / 1_000_000;
}

/** What a call cost, from its usage. */
export function actualCost(price: Price, usage: { input_tokens: number; output_tokens: number }): number {
  return (usage.input_tokens * price.input + usage.output_tokens * price.output) / 1_000_000;
}

/** An in-memory store with expiry, for development and tests. */
export function memoryStore(clock: Clock = Date.now): CounterStore & { size(): number } {
  const counters = new Map<string, { value: number; expiresAt: number }>();
  return {
    async incrBy(key, by, expiresAt) {
      const now = clock();
      const current = counters.get(key);
      const value = (current && current.expiresAt > now ? current.value : 0) + by;
      counters.set(key, { value, expiresAt });
      return value;
    },
    size() {
      const now = clock();
      return [...counters.values()].filter((c) => c.expiresAt > now).length;
    },
  };
}
