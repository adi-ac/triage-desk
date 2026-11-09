/**
 * The live-triage limits (lib/live-limits.ts), with a fake clock and a fake
 * store: `pnpm test`.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  actualCost,
  memoryStore,
  nextUtcMidnight,
  reserveSpend,
  spentToday,
  takeVisitorTriage,
  utcDay,
  worstCaseCost,
  type CounterStore,
} from "./live-limits.ts";

/** A clock that only moves when told to. */
function fakeClock(iso: string) {
  let now = Date.parse(iso);
  const clock = () => now;
  clock.advance = (ms: number) => void (now += ms);
  clock.set = (to: string) => void (now = Date.parse(to));
  return clock;
}

/** A store that answers each increment after a pause, so concurrent calls interleave as they would over the network. */
function slowStore(clock: () => number): CounterStore {
  const inner = memoryStore(clock);
  return {
    incrBy: async (key, by, expiresAt) => (
      await new Promise((r) => setTimeout(r, Math.random() * 5)),
      inner.incrBy(key, by, expiresAt)
    ),
  };
}

const HOUR = 60 * 60 * 1000;

describe("days", () => {
  test("a day is the UTC date, and resets at the next UTC midnight", () => {
    const now = Date.parse("2026-11-08T23:59:59.999Z");
    assert.equal(utcDay(now), "2026-11-08");
    assert.equal(new Date(nextUtcMidnight(now)).toISOString(), "2026-11-09T00:00:00.000Z");
    assert.equal(
      new Date(nextUtcMidnight(Date.parse("2026-11-09T00:00:00.000Z"))).toISOString(),
      "2026-11-10T00:00:00.000Z",
    );
  });
});

describe("per-visitor limit", () => {
  test("allows the limit, then refuses until the next UTC midnight", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    for (let i = 0; i < 5; i++)
      assert.equal((await takeVisitorTriage(store, ["ip:a", "cookie:a"], 5, clock())).ok, true);
    const refused = await takeVisitorTriage(store, ["ip:a", "cookie:a"], 5, clock());
    assert.deepEqual(refused, { ok: false, resetsAt: "2026-11-09T00:00:00.000Z" });

    clock.set("2026-11-08T23:59:59Z");
    assert.equal((await takeVisitorTriage(store, ["ip:a", "cookie:a"], 5, clock())).ok, false);
    clock.set("2026-11-09T00:00:00Z");
    assert.equal((await takeVisitorTriage(store, ["ip:a", "cookie:a"], 5, clock())).ok, true);
  });

  test("counts every ID: a new cookie on the same IP is still refused, and so is the same cookie on a new IP", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    for (let i = 0; i < 3; i++) await takeVisitorTriage(store, ["ip:a", "cookie:a"], 3, clock());
    assert.equal((await takeVisitorTriage(store, ["ip:a", "cookie:new"], 3, clock())).ok, false);
    assert.equal((await takeVisitorTriage(store, ["ip:new", "cookie:a"], 3, clock())).ok, false);
    // Other visitors are untouched, and the refusals above counted nothing for the new IDs.
    for (let i = 0; i < 3; i++)
      assert.equal((await takeVisitorTriage(store, ["ip:new", "cookie:new"], 3, clock())).ok, true);
  });

  test("a refusal counts nothing, so waiting out a burst of refusals doesn't cost tomorrow's triages", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    await takeVisitorTriage(store, ["ip:a"], 1, clock());
    for (let i = 0; i < 10; i++) await takeVisitorTriage(store, ["ip:a"], 1, clock());
    assert.equal(await store.incrBy(`triage:visitor:${utcDay(clock())}:ip:a`, 0, nextUtcMidnight(clock())), 1);
  });

  test("release gives a triage back", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    const first = await takeVisitorTriage(store, ["ip:a"], 1, clock());
    assert.ok(first.ok);
    await first.release();
    assert.equal((await takeVisitorTriage(store, ["ip:a"], 1, clock())).ok, true);
  });

  test("a limit of 0 refuses everyone", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    assert.equal((await takeVisitorTriage(memoryStore(clock), ["ip:a"], 0, clock())).ok, false);
  });

  test("concurrent requests never get more than the limit", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = slowStore(clock);
    const results = await Promise.all(
      Array.from({ length: 40 }, () => takeVisitorTriage(store, ["ip:a", "cookie:a"], 5, clock())),
    );
    assert.ok(results.filter((r) => r.ok).length <= 5);
  });

  test("counters expire after their day", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    await takeVisitorTriage(store, ["ip:a", "cookie:a"], 5, clock());
    assert.equal(store.size(), 2);
    clock.set("2026-11-09T01:00:01Z");
    assert.equal(store.size(), 0);
  });
});

describe("daily spend cap", () => {
  test("reserves the worst case, then settles to the actual cost", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    const r = await reserveSpend(store, 0.12, 2, clock());
    assert.ok(r.ok);
    assert.equal(await spentToday(store, clock()), 0.12);
    await r.settle(0.031);
    assert.equal(await spentToday(store, clock()), 0.031);
    // Settling twice changes nothing.
    await r.settle(0);
    assert.equal(await spentToday(store, clock()), 0.031);
  });

  test("refuses a call whose worst case would pass the cap, and counts nothing for it", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    for (let i = 0; i < 4; i++) {
      const r = await reserveSpend(store, 0.5, 2, clock());
      assert.ok(r.ok);
    }
    assert.equal(await spentToday(store, clock()), 2);
    assert.deepEqual(await reserveSpend(store, 0.01, 2, clock()), { ok: false, resetsAt: "2026-11-09T00:00:00.000Z" });
    assert.equal(await spentToday(store, clock()), 2);
  });

  test("settling frees room for more calls", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    const a = await reserveSpend(store, 1, 1, clock());
    assert.ok(a.ok);
    assert.equal((await reserveSpend(store, 1, 1, clock())).ok, false);
    await a.settle(0.2);
    assert.equal((await reserveSpend(store, 0.8, 1, clock())).ok, true);
  });

  test("never settles above the reservation", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = memoryStore(clock);
    const r = await reserveSpend(store, 0.1, 2, clock());
    assert.ok(r.ok);
    await r.settle(5);
    assert.equal(await spentToday(store, clock()), 0.1);
  });

  test("concurrent calls can't overshoot the cap", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    const store = slowStore(clock);
    const results = await Promise.all(Array.from({ length: 60 }, () => reserveSpend(store, 0.12, 2, clock())));
    const granted = results.filter((r) => r.ok);
    assert.ok(granted.length <= Math.floor(2 / 0.12));
    assert.ok(granted.length > 0);
    assert.ok((await spentToday(store, clock())) <= 2);
    // And after every call settles to its actual cost, the total is just those costs.
    await Promise.all(granted.map((r) => r.ok && r.settle(0.03)));
    assert.equal(Math.round((await spentToday(store, clock())) * 1e6), granted.length * 30_000);
  });

  test("a call that settles after midnight settles yesterday's total, and today starts at zero", async () => {
    const clock = fakeClock("2026-11-08T23:59:30Z");
    const store = memoryStore(clock);
    const r = await reserveSpend(store, 2, 2, clock());
    assert.ok(r.ok);
    const yesterday = clock();
    clock.advance(HOUR / 2);
    assert.equal(await spentToday(store, clock()), 0);
    assert.equal((await reserveSpend(store, 2, 2, clock())).ok, true);
    await r.settle(0.05);
    assert.equal(await spentToday(store, yesterday), 0.05);
    assert.equal(await spentToday(store, clock()), 2);
  });

  test("a cap of 0 refuses every call", async () => {
    const clock = fakeClock("2026-11-08T10:00:00Z");
    assert.equal((await reserveSpend(memoryStore(clock), 0.01, 0, clock())).ok, false);
  });
});

describe("costs", () => {
  const price = { input: 2, output: 10 };

  test("the worst case bounds input by bytes plus overhead, and output by max_tokens", () => {
    // (10,000 + 2,000) input tokens at $2/M, 8,000 output tokens at $10/M.
    assert.equal(worstCaseCost(price, 10_000, 2_000, 8_000), 0.104);
  });

  test("the actual cost comes from usage", () => {
    assert.equal(actualCost(price, { input_tokens: 4_000, output_tokens: 2_500 }), 0.033);
  });
});
