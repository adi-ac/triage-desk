"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Skeleton, SkulletProvider } from "skullet/react";
import {
  ApproveBar,
  Banner,
  Button,
  DraftEditor,
  EmailBody,
  FieldReview,
  NoActionReview,
  Pane,
  Time,
  Timeline,
  TimelineRow,
  TRIAGE_STEPS,
  WorkingStatus,
} from "@/components/ui";
import { skeletonEmail, skeletonSuggestion } from "@/fixtures/skeleton-sample";
import { ruleSendFor, suggestionFor } from "@/fixtures/suggestions";
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
import { couldBeAdded, type AddedTicket, type LiveTriage } from "../added-tickets";
import {
  initialFor,
  modelRow,
  modelRowText,
  personRow,
  reasonText,
  useInbox,
  type ActivityRow,
  type TicketState,
} from "../inbox-state";
import styles from "./ticket.module.css";

const targets = { category: "field-category", urgency: "field-urgency", draft: "draft-reply" };
/** The loading skeleton's own ids, so they never clash with the content crossfading in over it. */
const skeletonTargets = { category: "skeleton-category", urgency: "skeleton-urgency", draft: "skeleton-draft" };

type Targets = typeof targets;
type Email = { body: string; subject: string };
type Change = (change: (state: TicketState) => TicketState) => void;
type OnEvidence = (quote: string | null) => void;

export function TicketPanes() {
  const { id: ticketId } = useParams<{ id: string }>();
  const { ticketFor, addedFor, addedLoaded, effectiveFor } = useInbox();
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const ticket = ticketFor(ticketId);
  if (!ticket) {
    // An added ticket's ID before the tab's tickets have been read (the
    // server, and the render that hydrates): empty panes, not a 404.
    if (!addedLoaded && couldBeAdded(ticketId)) return <WaitingPanes ticketId={ticketId} />;
    notFound();
  }
  const added = addedFor(ticketId);
  const original = suggestionFor(ticketId);
  const suggestion = effectiveFor(ticketId);
  const email = { body: ticket.body, subject: ticket.subject };
  const company = ticket.account ? `${ticket.account.company} · ${ticket.account.plan}` : null;

  return (
    <>
      {/* The page can't read the ID on the server (it would block instant
          navigation), so the tab title comes from here; React puts it in <head>. */}
      <title>{`${ticketId} · TriageDesk`}</title>
      <Pane title="Email" meta={<span className="text-mono-small">{ticket.id}</span>}>
        <article>
          <EmailBody
            subject={ticket.subject || "(No subject)"}
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
                  {company ??
                    (added?.company
                      ? `${added.company} · No matching Ledgerline account`
                      : "No matching Ledgerline account")}
                </p>
                <p className={styles.muted}>
                  <Received key={ticket.id} at={ticket.receivedAt} justAdded={added !== undefined} />
                </p>
              </div>
            }
          />
        </article>
      </Pane>

      {added ? (
        <LiveTriagePane
          key={ticketId}
          ticketId={ticketId}
          email={email}
          added={added}
          onEvidenceActive={setActiveQuote}
        />
      ) : !suggestion ? (
        <Pane title="Triage">
          <div className={styles.empty}>
            <p className="text-body-strong">The AI hasn&apos;t triaged this ticket yet.</p>
            <p className={`text-small ${styles.secondary}`}>
              There&apos;s no suggested category, urgency or draft, so there&apos;s nothing to approve.
            </p>
          </div>
        </Pane>
      ) : suggestion.kind === "not-a-request" ? (
        <NoActionTriage
          key={ticketId}
          ticketId={ticketId}
          email={email}
          suggestion={suggestion}
          onEvidenceActive={setActiveQuote}
        />
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

/** "Received just now" for a ticket added in the last minute; otherwise its time. */
function Received({ at, justAdded }: { at: string; justAdded: boolean }) {
  const [justNow] = useState(() => justAdded && Date.now() - Date.parse(at) < 60_000);
  return justNow ? (
    <>Received just now</>
  ) : (
    <>
      Received <Time dateTime={at} />
    </>
  );
}

/** An added ticket's URL before the tab's tickets have been read: the panes' frames, empty. */
function WaitingPanes({ ticketId }: { ticketId: string }) {
  return (
    <>
      <title>{`${ticketId} · TriageDesk`}</title>
      <Pane title="Email" meta={<span className="text-mono-small">{ticketId}</span>} aria-busy />
      <Pane title="Triage" aria-busy />
    </>
  );
}

const evidenceFor = (email: Email, s: { evidence: TriageSuggestion["evidence"] }, supports: "category" | "urgency") =>
  matchEvidence(email.body, s.evidence, email.subject).filter((e) => e.supports === supports);

function useNext(ticketId: string) {
  const router = useRouter();
  const { queue } = useInbox();
  return () => {
    const order = flatQueue(queue);
    const i = order.findIndex((t) => t.id === ticketId);
    router.push(`/tickets/${order[(i + 1) % order.length].id}`);
  };
}

const blockersFor = (suggestion: TriageSuggestion, state: TicketState) =>
  approveBlockers({
    fields: [
      approveField("category", suggestion.category, state.category),
      approveField("urgency", suggestion.urgency, state.urgency),
    ],
    draft: state.draft,
  });

/** The activity rows, as an array: Timeline counts its children for "Activity · n". */
const activityRows = (rows: ActivityRow[]) =>
  rows.map(({ id, actor, name, at, text }) =>
    actor === "human" ? (
      <TimelineRow key={id} actor="human" name={name ?? "You"} at={at}>
        {text}
      </TimelineRow>
    ) : (
      <TimelineRow key={id} actor="ai" name={name} at={at}>
        {text}
      </TimelineRow>
    ),
  );

type TriageViewProps = {
  ticketId: string;
  email: Email;
  suggestion: TriageSuggestion;
  /** The "Not a request" suggestion this replaced, after "Triage anyway". */
  prior?: NotARequestSuggestion;
  state: TicketState;
  update: Change;
  onEvidenceActive: OnEvidence;
  ids?: Targets;
};

/** A ticket waiting for a person: the fields and the draft to review (its pane's content). */
function TriageFields({
  ticketId,
  email,
  suggestion,
  prior,
  state,
  update,
  onEvidenceActive,
  ids = targets,
}: TriageViewProps) {
  const sent = state.sentAt !== null;
  const blockers = blockersFor(suggestion, state);

  const chooseCategory = (next: Category) =>
    update((s) => ({
      ...s,
      category: next,
      activity: [
        ...s.activity,
        personRow(
          s.category === null && next === suggestion.category.value
            ? `kept the category as ${next}`
            : `set the category to ${next}`,
        ),
      ],
    }));

  const chooseUrgency = (next: Urgency) =>
    update((s) => ({
      ...s,
      urgency: next,
      activity: [
        ...s.activity,
        personRow(
          s.urgency === null && next === suggestion.urgency.value
            ? `kept the urgency as ${next}`
            : `set the urgency to ${next}`,
        ),
      ],
    }));

  const stale = [
    state.category && state.category !== suggestion.category.value
      ? `The draft was written for ${suggestion.category.value}; the category is now ${state.category}.`
      : null,
    state.urgency && state.urgency !== suggestion.urgency.value
      ? `The draft was written for ${suggestion.urgency.value} urgency; it's now ${state.urgency}.`
      : null,
  ].filter(Boolean);

  const note = sent
    ? `Drafted by AI, ${state.draftEdited ? "edited and approved" : "approved"} by you`
    : state.draftEdited
      ? "Drafted by AI, edited by you"
      : "Drafted by AI";

  return (
    <div className={styles.triage}>
      <FieldReview
        id={ids.category}
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
        id={ids.urgency}
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
      {suggestion.agentNote && <Banner title="AI note">{suggestion.agentNote}</Banner>}
      <DraftEditor
        key={ticketId}
        id={ids.draft}
        label={sent ? "Reply" : "Draft reply"}
        state={sent ? "approved" : state.draftEdited ? "edited" : "suggested"}
        onStateChange={() =>
          update((s) =>
            s.draftEdited ? s : { ...s, draftEdited: true, activity: [...s.activity, personRow("edited the draft")] },
          )
        }
        note={note}
        blocker={blockers.find((b) => b.target === "draft")?.message}
        warning={!sent && stale.length > 0 ? `${stale.join(" ")} Check it still fits.` : undefined}
        rows={10}
        value={state.draft}
        onChange={(e) => {
          const draft = e.target.value;
          update((s) => ({ ...s, draft }));
        }}
      />
      <Timeline>
        {/* After "Triage anyway", the activity already holds Claude's new suggestion. */}
        <TimelineRow actor="ai" at={(prior ?? suggestion).suggestedAt}>
          {prior ? reasonText(prior) : modelRowText(suggestion)}
        </TimelineRow>
        {activityRows(state.activity)}
      </Timeline>
    </div>
  );
}

/** Approve and what follows it (its pane's footer). */
function TriageFooter({
  ticketId,
  suggestion,
  state,
  update,
  ids = targets,
}: Pick<TriageViewProps, "ticketId" | "suggestion" | "state" | "update" | "ids">) {
  const next = useNext(ticketId);
  const blockers = blockersFor(suggestion, state);

  const approve = () => {
    if (blockers.length > 0) return;
    const untouched = [
      state.category === null ? `approved the category as suggested: ${suggestion.category.value}` : null,
      state.urgency === null ? `approved the urgency as suggested: ${suggestion.urgency.value}` : null,
    ].filter((t): t is string => t !== null);
    update((s) => {
      const rows = [...untouched, "approved and sent the reply"].map(personRow);
      return { ...s, sentAt: rows[rows.length - 1].at, activity: [...s.activity, ...rows] };
    });
  };

  return (
    <ApproveBar
      blockers={blockers}
      targets={ids}
      onApprove={approve}
      sentAt={state.sentAt}
      afterSend="next-ticket"
      onAfterSend={next}
    />
  );
}

type FixtureTriageProps = Omit<TriageViewProps, "state" | "update" | "ids">;

/** A ticket waiting for a person: review the fields and the draft, then Approve. */
function Triage(props: FixtureTriageProps) {
  const { stateFor, update } = useInbox();
  const state = stateFor(props.ticketId);
  const change: Change = (c) => update(props.ticketId, c);
  return (
    <Pane title="Triage" footer={<TriageFooter {...props} state={state} update={change} />}>
      <TriageFields {...props} state={state} update={change} />
    </Pane>
  );
}

/** A reply a team rule sent without review: a read-only record with no decision styling. */
function RuleSentTriage({ ticketId, email, suggestion, onEvidenceActive }: FixtureTriageProps) {
  const next = useNext(ticketId);
  const send = ruleSendFor(ticketId)!;

  return (
    <Pane
      title="Triage"
      footer={
        <ApproveBar
          blockers={[]}
          targets={targets}
          onApprove={() => {}}
          sentAt={send.sentAt}
          sentBy="rule"
          afterSend="next-ticket"
          onAfterSend={next}
        />
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
        {suggestion.agentNote && <Banner title="AI note">{suggestion.agentNote}</Banner>}
        <DraftEditor
          key={ticketId}
          label="Reply"
          state="sent-by-rule"
          note="Drafted by AI, sent by rule without review"
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
  email: Email;
  suggestion: NotARequestSuggestion;
  state: TicketState;
  update: Change;
  onTriageAnyway?: () => void;
  onEvidenceActive: OnEvidence;
};

/**
 * Claude suggests the email isn't a request. Still a suggestion: a person
 * keeps it (closing the ticket without a reply) or triages it anyway. No
 * Approve here: there's no reply to approve.
 */
function NoActionFields({ email, suggestion, state, update, onTriageAnyway, onEvidenceActive }: NoActionProps) {
  const keep = () =>
    update((s) => {
      const row = personRow("closed the ticket without a reply");
      return { ...s, closedAt: row.at, activity: [...s.activity, row] };
    });

  return (
    <div className={styles.triage}>
      <NoActionReview
        reason={suggestion.reason}
        explanation={suggestion.explanation}
        evidence={matchEvidence(email.body, suggestion.evidence, email.subject)}
        onEvidenceActive={onEvidenceActive}
        closed={state.closedAt !== null}
        onKeep={keep}
        onTriageAnyway={onTriageAnyway}
      />
      {suggestion.agentNote && <Banner title="AI note">{suggestion.agentNote}</Banner>}
      <Timeline>
        <TimelineRow actor="ai" at={suggestion.suggestedAt}>
          {reasonText(suggestion)}
        </TimelineRow>
        {activityRows(state.activity)}
      </Timeline>
    </div>
  );
}

/** "Closed by you · <time>" once a person keeps "Not a request". */
function ClosedFooter({ ticketId, closedAt }: { ticketId: string; closedAt: string }) {
  const next = useNext(ticketId);
  return (
    <ApproveBar
      blockers={[]}
      targets={targets}
      onApprove={() => {}}
      sentAt={closedAt}
      outcome="closed"
      afterSend="next-ticket"
      onAfterSend={next}
    />
  );
}

function NoActionTriage({
  ticketId,
  ...props
}: Omit<NoActionProps, "state" | "update" | "onTriageAnyway"> & { ticketId: string }) {
  const { stateFor, update } = useInbox();
  const state = stateFor(ticketId);
  const anyway = props.suggestion.triageAnyway;

  const triageAnyway = anyway
    ? () =>
        update(ticketId, (s) => ({
          ...s,
          triagedAnyway: true,
          draft: anyway.draft,
          activity: [...s.activity, personRow("asked the AI to triage it anyway"), modelRow(modelRowText(anyway))],
        }))
    : undefined;

  return (
    <Pane
      title="Triage"
      footer={state.closedAt ? <ClosedFooter ticketId={ticketId} closedAt={state.closedAt} /> : undefined}
    >
      <NoActionFields {...props} state={state} update={(c) => update(ticketId, c)} onTriageAnyway={triageAnyway} />
    </Pane>
  );
}

/**
 * Why a live triage didn't come back, in the Triage pane (DESIGN.md,
 * Loading and errors). The ticket stays in the queue whatever happened.
 */
function LiveProblem({
  failure,
  onRetry,
}: {
  failure: Extract<LiveTriage, { status: "failed" }>;
  onRetry: () => void;
}) {
  const retry = (
    <Button size="small" onClick={onRetry}>
      Try again
    </Button>
  );
  switch (failure.error) {
    case "model":
      return <Banner tone="error" title="The AI couldn't triage this ticket" action={retry} />;
    case "interrupted":
      return <Banner tone="error" title="Triage stopped when the page reloaded" action={retry} />;
    case "visitor-limit":
      return (
        <Banner title="You've used today's live triages">
          {failure.resetsAt ? (
            <>
              They reset at <Time dateTime={failure.resetsAt} />. Until then, this ticket stays untriaged.
            </>
          ) : (
            "They reset at midnight UTC. Until then, this ticket stays untriaged."
          )}
        </Banner>
      );
    case "daily-cap":
    case "unavailable":
      return <Banner title="Live triage is paused for today">The example tickets still work.</Banner>;
  }
}

/**
 * The Triage pane of a ticket added with the New ticket form: a skeleton
 * while the AI works (Skullet, measured from a typical suggestion rendered
 * through the real components, here and in the footer), WorkingStatus at
 * the header's right end stepping through what it's doing, then the
 * suggestion crossfading in over it, or what went wrong.
 */
function LiveTriagePane({
  ticketId,
  email,
  added,
  onEvidenceActive,
}: {
  ticketId: string;
  email: Email;
  added: AddedTicket;
  onEvidenceActive: OnEvidence;
}) {
  const inbox = useInbox();
  const state = inbox.stateFor(ticketId);
  const change: Change = (c) => inbox.update(ticketId, c);
  const suggestion = inbox.effectiveFor(ticketId);
  const prior = added.suggestion?.kind === "not-a-request" ? added.suggestion : undefined;
  const waiting = added.triage.status === "triaging" || added.anyway?.status === "triaging";

  let body: ReactNode = null;
  let footer: ReactNode = null;
  if (waiting) {
    const sample = {
      ticketId: "skeleton",
      suggestion: skeletonSuggestion,
      state: initialFor(skeletonSuggestion),
      update: () => {},
    };
    body = <TriageFields {...sample} email={skeletonEmail} onEvidenceActive={() => {}} ids={skeletonTargets} />;
    footer = <TriageFooter {...sample} ids={skeletonTargets} />;
  } else if (suggestion?.kind === "triage") {
    const props = { ticketId, suggestion, state, update: change };
    body = <TriageFields {...props} email={email} prior={prior} onEvidenceActive={onEvidenceActive} />;
    footer = <TriageFooter {...props} />;
  } else if (suggestion?.kind === "not-a-request") {
    body = (
      <>
        {added.anyway?.status === "failed" && (
          <div className={styles.problem}>
            <LiveProblem failure={added.anyway} onRetry={() => inbox.triageAnyway(ticketId)} />
          </div>
        )}
        <NoActionFields
          email={email}
          suggestion={suggestion}
          state={state}
          update={change}
          onTriageAnyway={() => inbox.triageAnyway(ticketId)}
          onEvidenceActive={onEvidenceActive}
        />
      </>
    );
    footer = state.closedAt ? <ClosedFooter ticketId={ticketId} closedAt={state.closedAt} /> : null;
  } else if (added.triage.status === "failed") {
    body = <LiveProblem failure={added.triage} onRetry={() => inbox.triage(ticketId)} />;
  }

  // An answer with no Approve ("not a request", or a failure): the
  // skeleton's Approve bar fades out rather than vanishing.
  const [wasWaiting, setWasWaiting] = useState(waiting);
  const [footerLeaving, setFooterLeaving] = useState(false);
  if (wasWaiting !== waiting) {
    setWasWaiting(waiting);
    setFooterLeaving(!waiting && footer === null);
  }
  const footerSlot = footer ? (
    <Skeleton loading={waiting}>{footer}</Skeleton>
  ) : footerLeaving ? (
    <div className={styles.leaving} onAnimationEnd={() => setFooterLeaving(false)}>
      <Skeleton loading>
        <TriageFooter
          ticketId="skeleton"
          suggestion={skeletonSuggestion}
          state={initialFor(skeletonSuggestion)}
          update={() => {}}
          ids={skeletonTargets}
        />
      </Skeleton>
    </div>
  ) : undefined;

  return (
    <div className={styles.live}>
      <SkulletProvider reveal="together">
        <Pane
          title="Triage"
          status={<WorkingStatus key={ticketId} steps={TRIAGE_STEPS} active={waiting} />}
          footer={footerSlot}
        >
          <Skeleton loading={waiting} label="Triaging this ticket">
            {body}
          </Skeleton>
        </Pane>
      </SkulletProvider>
    </div>
  );
}
