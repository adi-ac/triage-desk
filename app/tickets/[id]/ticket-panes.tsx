"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ApproveBar,
  Banner,
  DraftEditor,
  EmailBody,
  FieldReview,
  NoActionReview,
  Pane,
  Time,
  Timeline,
  TimelineRow,
} from "@/components/ui";
import { ruleSendFor, suggestionFor } from "@/fixtures/suggestions";
import { tickets } from "@/fixtures/tickets";
import { approveBlockers, approveField } from "@/lib/approve";
import { flatQueue } from "@/lib/queue";
import { matchEvidence } from "@/lib/evidence";
import {
  categories,
  urgencies,
  type Category,
  type NotARequestSuggestion,
  type TriageSuggestion,
  type Urgency,
} from "@/lib/suggestion";
import { modelRow, personRow, useInbox } from "../inbox-state";
import styles from "./ticket.module.css";

const targets = { category: "field-category", urgency: "field-urgency", draft: "draft-reply" };

export function TicketPanes() {
  const { id: ticketId } = useParams<{ id: string }>();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) notFound();
  const { effectiveFor } = useInbox();
  const original = suggestionFor(ticketId);
  const suggestion = effectiveFor(ticketId);
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const email = { body: ticket.body, subject: ticket.subject };

  return (
    <>
      {/* The page can't read the ID on the server (it would block instant
          navigation), so the tab title comes from here; React puts it in <head>. */}
      <title>{`${ticketId} · Triage Desk`}</title>
      <Pane title="Email" meta={<span className="text-mono-small">{ticket.id}</span>}>
        <article>
          <EmailBody
            subject={ticket.subject}
            body={ticket.body}
            evidence={suggestion?.evidence}
            activeQuote={activeQuote}
            meta={
              <div className={`text-small ${styles.sender}`}>
                <p>
                  <span className="text-body-strong">{ticket.from.name}</span>{" "}
                  <span className={styles.muted}>{ticket.from.email}</span>
                </p>
                <p className={styles.secondary}>
                  {ticket.account ? `${ticket.account.company} · ${ticket.account.plan}` : "No matching Ledgerline account"}
                </p>
                <p className={styles.muted}>
                  Received <Time dateTime={ticket.receivedAt} />
                </p>
              </div>
            }
          />
        </article>
      </Pane>

      {!suggestion ? (
        <Pane title="Triage">
          <div className={styles.empty}>
            <p className="text-body-strong">Claude hasn&apos;t triaged this ticket yet.</p>
            <p className={`text-small ${styles.secondary}`}>
              There&apos;s no suggested category, urgency or draft, so there&apos;s nothing to approve.
            </p>
          </div>
        </Pane>
      ) : suggestion.kind === "not-a-request" ? (
        <NoActionTriage key={ticketId} ticketId={ticketId} email={email} suggestion={suggestion} onEvidenceActive={setActiveQuote} />
      ) : ruleSendFor(ticketId) ? (
        <RuleSentTriage ticketId={ticketId} email={email} suggestion={suggestion} onEvidenceActive={setActiveQuote} />
      ) : (
        <Triage
          key={ticketId}
          ticketId={ticketId}
          email={email}
          suggestion={suggestion}
          prior={original?.kind === "not-a-request" ? original : undefined}
          onEvidenceActive={setActiveQuote}
        />
      )}
    </>
  );
}

type Email = { body: string; subject: string };

type TriageProps = {
  ticketId: string;
  email: Email;
  suggestion: TriageSuggestion;
  /** The "Not a request" suggestion this replaced, after "Triage anyway". */
  prior?: NotARequestSuggestion;
  onEvidenceActive: (quote: string | null) => void;
};

const evidenceFor = (email: Email, s: { evidence: TriageSuggestion["evidence"] }, supports: "category" | "urgency") =>
  matchEvidence(email.body, s.evidence, email.subject).filter((e) => e.supports === supports);

const modelRowText = (s: TriageSuggestion) =>
  `suggested ${s.category.value} and ${s.urgency.value} urgency, and drafted a reply`;

const reasonText = (s: NotARequestSuggestion) => `suggested this isn't a request (${s.reason})`;

function useNext(ticketId: string) {
  const router = useRouter();
  const { queue } = useInbox();
  return () => {
    const order = flatQueue(queue);
    const i = order.findIndex((t) => t.id === ticketId);
    router.push(`/tickets/${order[(i + 1) % order.length].id}`);
  };
}

/** A ticket waiting for a person: review the fields and the draft, then Approve. */
function Triage({ ticketId, email, suggestion, prior, onEvidenceActive }: TriageProps) {
  const next = useNext(ticketId);
  const { stateFor, update } = useInbox();
  const state = stateFor(ticketId);
  const sent = state.sentAt !== null;

  const blockers = approveBlockers({
    fields: [
      approveField("category", suggestion.category, state.category),
      approveField("urgency", suggestion.urgency, state.urgency),
    ],
    draft: state.draft,
  });

  const chooseCategory = (next: Category) =>
    update(ticketId, (s) => ({
      ...s,
      category: next,
      activity: [
        ...s.activity,
        personRow(s.category === null && next === suggestion.category.value ? `kept the category as ${next}` : `set the category to ${next}`),
      ],
    }));

  const chooseUrgency = (next: Urgency) =>
    update(ticketId, (s) => ({
      ...s,
      urgency: next,
      activity: [
        ...s.activity,
        personRow(s.urgency === null && next === suggestion.urgency.value ? `kept the urgency as ${next}` : `set the urgency to ${next}`),
      ],
    }));

  const approve = () => {
    if (blockers.length > 0) return;
    const untouched = [
      state.category === null ? `approved the category as suggested: ${suggestion.category.value}` : null,
      state.urgency === null ? `approved the urgency as suggested: ${suggestion.urgency.value}` : null,
    ].filter((t): t is string => t !== null);
    update(ticketId, (s) => {
      const rows = [...untouched, "approved and sent the reply"].map(personRow);
      return { ...s, sentAt: rows[rows.length - 1].at, activity: [...s.activity, ...rows] };
    });
  };

  const stale = [
    state.category && state.category !== suggestion.category.value
      ? `The draft was written for ${suggestion.category.value}; the category is now ${state.category}.`
      : null,
    state.urgency && state.urgency !== suggestion.urgency.value
      ? `The draft was written for ${suggestion.urgency.value} urgency; it's now ${state.urgency}.`
      : null,
  ].filter(Boolean);

  const note = sent
    ? `Drafted by the model, ${state.draftEdited ? "edited and approved" : "approved"} by you`
    : state.draftEdited
      ? "Drafted by the model, edited by you"
      : "Drafted by the model";

  return (
    <Pane
      title="Triage"
      footer={
        <ApproveBar
          blockers={blockers}
          targets={targets}
          onApprove={approve}
          sentAt={state.sentAt}
          afterSend="next-ticket"
          onAfterSend={next}
        />
      }
    >
      <div className={styles.triage}>
        <FieldReview
          id={targets.category}
          label="Category"
          field={suggestion.category}
          options={categories}
          value={state.category}
          onValueChange={chooseCategory}
          approved={sent}
          explainEstimate
          evidence={evidenceFor(email, suggestion, "category")}
          onEvidenceActive={onEvidenceActive}
        />
        <FieldReview
          id={targets.urgency}
          label="Urgency"
          field={suggestion.urgency}
          options={urgencies}
          value={state.urgency}
          onValueChange={chooseUrgency}
          approved={sent}
          explainEstimate={state.category !== null}
          evidence={evidenceFor(email, suggestion, "urgency")}
          onEvidenceActive={onEvidenceActive}
        />
        {suggestion.agentNote && <Banner title="Claude's note">{suggestion.agentNote}</Banner>}
        <DraftEditor
          key={ticketId}
          id={targets.draft}
          label={sent ? "Reply" : "Draft reply"}
          state={sent ? "approved" : state.draftEdited ? "edited" : "suggested"}
          onStateChange={() =>
            update(ticketId, (s) => (s.draftEdited ? s : { ...s, draftEdited: true, activity: [...s.activity, personRow("edited the draft")] }))
          }
          note={note}
          blocker={blockers.find((b) => b.target === "draft")?.message}
          warning={!sent && stale.length > 0 ? `${stale.join(" ")} Check it still fits.` : undefined}
          rows={10}
          value={state.draft}
          onChange={(e) => {
            const draft = e.target.value;
            update(ticketId, (s) => ({ ...s, draft }));
          }}
        />
        <Timeline>
          {/* After "Triage anyway", the activity already holds Claude's new suggestion. */}
          <TimelineRow actor="ai" at={(prior ?? suggestion).suggestedAt}>
            {prior ? reasonText(prior) : modelRowText(suggestion)}
          </TimelineRow>
          {state.activity.map(({ id, actor, name, at, text }) =>
            actor === "human" ? (
              <TimelineRow key={id} actor="human" name={name ?? "You"} at={at}>
                {text}
              </TimelineRow>
            ) : (
              <TimelineRow key={id} actor="ai" name={name} at={at}>
                {text}
              </TimelineRow>
            ),
          )}
        </Timeline>
      </div>
    </Pane>
  );
}

/** A reply a team rule sent without review: a read-only record with no decision styling. */
function RuleSentTriage({ ticketId, email, suggestion, onEvidenceActive }: TriageProps) {
  const next = useNext(ticketId);
  const send = ruleSendFor(ticketId)!;

  return (
    <Pane
      title="Triage"
      footer={
        <ApproveBar blockers={[]} targets={targets} onApprove={() => {}} sentAt={send.sentAt} sentBy="rule" afterSend="next-ticket" onAfterSend={next} />
      }
    >
      <div className={styles.triage}>
        <Banner title={`Sent by rule “${send.rule}”`}>{send.condition}. Nobody reviewed it.</Banner>
        <FieldReview
          label="Category"
          field={suggestion.category}
          options={categories}
          value={null}
          onValueChange={() => {}}
          readOnly
          explainEstimate
          evidence={evidenceFor(email, suggestion, "category")}
          onEvidenceActive={onEvidenceActive}
        />
        <FieldReview
          label="Urgency"
          field={suggestion.urgency}
          options={urgencies}
          value={null}
          onValueChange={() => {}}
          readOnly
          evidence={evidenceFor(email, suggestion, "urgency")}
          onEvidenceActive={onEvidenceActive}
        />
        {suggestion.agentNote && <Banner title="Claude's note">{suggestion.agentNote}</Banner>}
        <DraftEditor
          key={ticketId}
          label="Reply"
          state="sent-by-rule"
          note="Drafted by the model, sent by rule without review"
          rows={6}
          defaultValue={suggestion.draft}
        />
        <Timeline>
          <TimelineRow actor="ai" at={suggestion.suggestedAt}>
            {modelRowText(suggestion)}
          </TimelineRow>
          <TimelineRow actor="ai" name="Team rule" at={send.sentAt}>
            sent the reply under &ldquo;{send.rule}&rdquo;
          </TimelineRow>
        </Timeline>
      </div>
    </Pane>
  );
}

type NoActionProps = {
  ticketId: string;
  email: Email;
  suggestion: NotARequestSuggestion;
  onEvidenceActive: (quote: string | null) => void;
};

/**
 * Claude suggests the email isn't a request. Still a suggestion: a person
 * keeps it (closing the ticket without a reply) or triages it anyway. No
 * Approve here: there's no reply to approve.
 */
function NoActionTriage({ ticketId, email, suggestion, onEvidenceActive }: NoActionProps) {
  const next = useNext(ticketId);
  const { stateFor, update } = useInbox();
  const state = stateFor(ticketId);
  const anyway = suggestion.triageAnyway;

  const keep = () =>
    update(ticketId, (s) => {
      const row = personRow("closed the ticket without a reply");
      return { ...s, closedAt: row.at, activity: [...s.activity, row] };
    });

  const triageAnyway = anyway
    ? () =>
        update(ticketId, (s) => ({
          ...s,
          triagedAnyway: true,
          draft: anyway.draft,
          activity: [...s.activity, personRow("asked Claude to triage it anyway"), modelRow(modelRowText(anyway))],
        }))
    : undefined;

  return (
    <Pane
      title="Triage"
      footer={
        state.closedAt ? (
          <ApproveBar
            blockers={[]}
            targets={targets}
            onApprove={() => {}}
            sentAt={state.closedAt}
            outcome="closed"
            afterSend="next-ticket"
            onAfterSend={next}
          />
        ) : undefined
      }
    >
      <div className={styles.triage}>
        <NoActionReview
          reason={suggestion.reason}
          explanation={suggestion.explanation}
          evidence={matchEvidence(email.body, suggestion.evidence, email.subject)}
          onEvidenceActive={onEvidenceActive}
          closed={state.closedAt !== null}
          onKeep={keep}
          onTriageAnyway={triageAnyway}
        />
        {suggestion.agentNote && <Banner title="Claude's note">{suggestion.agentNote}</Banner>}
        <Timeline>
          <TimelineRow actor="ai" at={suggestion.suggestedAt}>
            {reasonText(suggestion)}
          </TimelineRow>
          {state.activity.map(({ id, actor, name, at, text }) =>
            actor === "human" ? (
              <TimelineRow key={id} actor="human" name={name ?? "You"} at={at}>
                {text}
              </TimelineRow>
            ) : (
              <TimelineRow key={id} actor="ai" name={name} at={at}>
                {text}
              </TimelineRow>
            ),
          )}
        </Timeline>
      </div>
    </Pane>
  );
}
