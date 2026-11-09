/**
 * What POST /api/triage takes, and what it answers when it can't triage.
 * Not server-only: the New ticket form can use the same limits for its
 * fields, so it never sends something the route will refuse.
 */

import { z } from "zod";

/** The longest each field may be, in characters, after trimming. Longer input is refused, never cut short. */
export const TRIAGE_LIMITS = { name: 80, company: 120, subject: 200, message: 5000 } as const;

/** Blank optional fields count as missing. */
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((s) => s || undefined);

export const TriageRequest = z.strictObject({
  name: z.string().trim().min(1).max(TRIAGE_LIMITS.name),
  company: optional(TRIAGE_LIMITS.company),
  subject: optional(TRIAGE_LIMITS.subject),
  message: z.string().trim().min(1).max(TRIAGE_LIMITS.message),
  /** Ask for a normal suggestion, after a "not a request" answer. */
  triageAnyway: z.boolean().optional(),
});

export type TriageRequest = z.infer<typeof TriageRequest>;

/**
 * The errors, by status:
 * - 400 invalid: a missing, blank or too-long field (fields names them), or a body that isn't JSON.
 * - 429 visitor-limit, daily-cap: over a limit until resetsAt (ISO 8601, the next UTC midnight).
 * - 502 model: the model's answer failed validation twice, or the call failed.
 * - 503 unavailable: live triage is switched off, or isn't configured.
 */
export type TriageError =
  | { error: "invalid"; fields: string[] }
  | { error: "visitor-limit" | "daily-cap"; resetsAt: string }
  | { error: "model" }
  | { error: "unavailable" };
