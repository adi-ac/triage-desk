import { confidenceThresholds, toPercent, unsureReason } from "./confidence";
import type { SuggestedField } from "./suggestion";

/** One triage field as the model suggested it, and whether a person has acted on it. */
export type ApproveField = {
  /** Lowercase, as it reads in a sentence: "category", "urgency". */
  name: string;
  value: string;
  /** 0–1. */
  confidence: number;
  runnerUp?: { value: string; confidence: number };
  /** A person kept or switched it. */
  confirmed: boolean;
};

/** An ApproveField from a suggested field and what a person chose for it (null: nothing yet). */
export function approveField(name: string, field: SuggestedField, chosen: string | null): ApproveField {
  return { name, value: field.value, confidence: field.confidence, runnerUp: field.runnerUp, confirmed: chosen !== null };
}

/** Unfilled [placeholders] in a draft, each listed once. */
export function draftPlaceholders(draft: string): string[] {
  return [...new Set(draft.match(/\[[^\]\n]+\]/g) ?? [])];
}

/**
 * Everything blocking Approve, one sentence each, with the number that
 * tripped it. Exactly three things block (DESIGN.md, rule 5):
 * an unsure field nobody has kept or switched (under 60%, or within 15
 * points of its runner-up), an unfilled [placeholder], and an empty draft.
 * A stale draft is a warning, not a blocker.
 */
export function approveBlockers({ fields, draft }: { fields: ApproveField[]; draft: string }): string[] {
  const blockers: string[] = [];

  for (const field of fields) {
    if (field.confirmed) continue;
    const reason = unsureReason(field.confidence, field.runnerUp?.confidence);
    if (!reason) continue;
    const choice = field.runnerUp
      ? `Keep ${field.value} or switch to ${field.runnerUp.value}.`
      : `Keep ${field.value} or change it.`;
    if (reason === "low") {
      blockers.push(
        `The model is ${toPercent(field.confidence)}% sure the ${field.name} is ${field.value}, below ${confidenceThresholds.medium}%. ${choice}`,
      );
    } else {
      const gap = toPercent(field.confidence) - toPercent(field.runnerUp!.confidence);
      blockers.push(
        `${field.value} leads ${field.runnerUp!.value} by ${gap} points for ${field.name}, inside the ${confidenceThresholds.margin}-point margin. ${choice}`,
      );
    }
  }

  if (draft.trim() === "") {
    blockers.push("The draft is empty.");
  } else {
    const open = draftPlaceholders(draft);
    if (open.length > 0) {
      blockers.push(`The draft has ${open.length} unfilled placeholder${open.length === 1 ? "" : "s"}: ${open.join(", ")}.`);
    }
  }

  return blockers;
}
