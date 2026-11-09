/**
 * Where live triage keeps its counters (lib/live-limits.ts): Upstash Redis
 * when it's configured (UPSTASH_REDIS_REST_URL and _TOKEN, or the
 * KV_REST_API_URL and _TOKEN that Vercel's Upstash integration adds), an
 * in-memory store in development otherwise, and nothing in production
 * without Redis: the route then fails closed.
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { memoryStore, type CounterStore } from "./live-limits.ts";

const configured = () =>
  Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN),
  );

function redisStore(redis: Redis): CounterStore {
  return {
    async incrBy(key, by, expiresAt) {
      // One round trip; the expiry is the same for every call on a key, so setting it each time is harmless.
      const [value] = await redis.pipeline().incrby(key, by).pexpireat(key, expiresAt).exec<[number, number]>();
      return value;
    },
  };
}

// Kept on globalThis so the dev server's module reloads don't reset the counts.
const shared = globalThis as typeof globalThis & { __triageStore?: CounterStore | null };

/** The counter store, or null when there's none (production without Redis). */
export function counterStore(): CounterStore | null {
  if (shared.__triageStore !== undefined) return shared.__triageStore;
  if (configured()) shared.__triageStore = redisStore(Redis.fromEnv());
  else if (process.env.NODE_ENV !== "production") shared.__triageStore = memoryStore();
  else shared.__triageStore = null;
  return shared.__triageStore;
}
