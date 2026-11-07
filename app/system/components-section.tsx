import { useState, type ReactNode } from "react";
import {
  ApproveBar,
  Banner,
  Button,
  Chip,
  ConfidenceMeter,
  DraftEditor,
  EmailBody,
  EvidenceItem,
  EvidenceMark,
  FieldReview,
  FabPanel,
  IconButton,
  Logo,
  Menu,
  NoActionReview,
  Pane,
  QueueItem,
  SegmentedControl,
  Severity,
  Tag,
  Time,
  Timeline,
  TimelineRow,
  confidenceThresholds,
} from "@/components/ui";
import { suggestionFor } from "@/fixtures/suggestions";
import { autoSendTicketId, firstScreenTicketId, tickets, type Ticket } from "@/fixtures/tickets";
import { approveBlockers, approveField } from "@/lib/approve";
import { matchEvidence } from "@/lib/evidence";
import { categories, urgencies, type Category, type Urgency } from "@/lib/suggestion";
import type { Pair } from "./contrast";
import { ContrastTable } from "./contrast-table";
import styles from "./system.module.css";

const firstScreen = tickets.find((t) => t.id === firstScreenTicketId)!;
const firstSuggestion = suggestionFor(firstScreenTicketId);
if (firstSuggestion?.kind !== "triage") throw new Error(`${firstScreenTicketId} should have a triage suggestion`);
const suggestion = firstSuggestion;
const demoBlockers = approveBlockers({
  fields: [approveField("category", suggestion.category, null), approveField("urgency", suggestion.urgency, null)],
  draft: suggestion.draft,
});
const excerpt = firstScreen.body.split("\n\n").slice(1, 4).join("\n\n");

function FabPanelDemo() {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.inline}>
      <Button
        size="small"
        onClick={() => {
          setOpen(false);
          setShown((s) => !s);
        }}
      >
        {shown ? "Hide the FAB" : "Show the FAB"}
      </Button>
      {shown && (
        <p className={`text-small ${styles.muted}`}>
          It&apos;s at the bottom right of this page, collapsed because the page is scrolled. Scroll to the very top to see it extend.
        </p>
      )}
      {shown && (
        <FabPanel open={open} onOpenChange={setOpen} title="Queue" icon="inbox">
          <div className={styles.queue}>
            {tickets.slice(0, 12).map((t) => (
              <QueueItem
                key={t.id}
                sender={t.from.name}
                company={t.account?.company}
                subject={t.subject || "(No subject)"}
                preview={preview(t)}
                receivedAt={t.receivedAt}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        </FabPanel>
      )}
    </div>
  );
}

function NoActionDemo() {
  const [closed, setClosed] = useState(false);
  const [anyway, setAnyway] = useState(false);
  if (anyway)
    return (
      <div className={styles.inline}>
        <p className={`text-small ${styles.muted}`}>Triage anyway shows a normal FieldReview suggestion here.</p>
        <Button size="small" onClick={() => setAnyway(false)}>
          Reset demo
        </Button>
      </div>
    );
  return (
    <>
      <NoActionReview
        reason="auto-reply"
        explanation="This is an automatic notice that an earlier request was resolved; nobody is asking for anything."
        evidence={[{ quote: "Automatic reply", supports: "category" }]}
        closed={closed}
        onKeep={() => setClosed(true)}
        onTriageAnyway={() => setAnyway(true)}
      />
      {closed && (
        <ApproveBar blockers={[]} targets={{}} onApprove={() => {}} sentAt="2026-11-02T16:55:00Z" outcome="closed" afterSend="next-ticket" onAfterSend={() => setClosed(false)} />
      )}
    </>
  );
}

/** Live, so the controls can be tried: each theme pane keeps its own state. */
function FieldReviewDemo() {
  const [category, setCategory] = useState<Category | null>(null);
  const [urgency, setUrgency] = useState<Urgency | null>("High");
  return (
    <>
      <FieldReview label="Category" field={suggestion.category} options={categories} value={category} onValueChange={setCategory} />
      <FieldReview label="Urgency" field={suggestion.urgency} options={urgencies} value={urgency} onValueChange={setUrgency} />
      <FieldReview
        label="Category"
        field={suggestion.category}
        options={categories}
        value={null}
        onValueChange={() => {}}
        evidence={matchEvidence(firstScreen.body, suggestion.evidence).filter((e) => e.supports === "category")}
        onEvidenceActive={() => {}}
      />
      <p className={`text-overline ${styles.muted}`}>Sent by a team rule</p>
      <FieldReview label="Urgency" field={suggestion.urgency} options={urgencies} value={null} onValueChange={() => {}} readOnly />
      <p className={`text-overline ${styles.muted}`}>After Approve, untouched</p>
      <FieldReview label="Urgency" field={suggestion.urgency} options={urgencies} value={null} onValueChange={() => {}} approved />
    </>
  );
}
const autoSent = tickets.find((t) => t.id === autoSendTicketId)!;

/** Pairs the components add on top of the ones theme.css and trust.css already check. */
const pairs: Pair[] = [
  { label: "Secondary button text on hover", fg: "--ink", bg: "--button-bg-hover", kind: "text" },
  { label: "Danger button text", fg: "--critical", bg: "--button-bg", kind: "text" },
  { label: "Danger button text on hover", fg: "--critical", bg: "--button-bg-hover", kind: "text" },
  { label: "Tag and banner text on surface-2", fg: "--ink-2", bg: "--surface-2", kind: "text" },
  { label: "Selected queue item text", fg: "--ink", bg: "--accent-soft", kind: "text" },
  { label: "Selected queue item company, time, preview", fg: "--ink-2", bg: "--accent-soft", kind: "text" },
  { label: "Who set it, on a decided chip", fg: "--ink-2", bg: "--decided-fill", kind: "text" },
  { label: "Icon button icon", fg: "--ink-2", bg: "--button-bg", kind: "non-text" },
  { label: "Theme toggle, selected icon", fg: "--ink", bg: "--button-bg", kind: "non-text" },
  { label: "Theme toggle, unselected icon on the track", fg: "--ink-2", bg: "--tray", kind: "non-text" },
  { label: "Logo on the page", fg: "--accent", bg: "--page", kind: "non-text" },
  { label: "Draft text in the editor", fg: "--ink", bg: "--surface", kind: "text" },
  { label: "Suggested draft text", fg: "--suggested-text", bg: "--suggested-fill", kind: "text" },
  { label: "Approved reply text", fg: "--ink", bg: "--decided-fill", kind: "text" },
  { label: "Approved reply border on surface", fg: "--decided-border", bg: "--surface", kind: "non-text" },
  { label: "Editor border on surface", fg: "--line-strong", bg: "--surface", kind: "non-text" },
];

/** Renders the same children in a light pane and a dark pane, side by side. */
function ThemePair({ children }: { children: ReactNode }) {
  return (
    <div className={styles.themePair}>
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} className={styles.themePane}>
          <p className={`text-overline ${styles.muted}`}>{theme === "light" ? "Light" : "Dark"}</p>
          {children}
        </div>
      ))}
    </div>
  );
}

function Demo({ name, props, intro, children }: { name: string; props?: string; intro: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.card}>
      <h3 className={`text-heading ${styles.cardTitle}`}>
        {name}
        {props && <code className={`text-mono-small ${styles.muted} ${styles.propsSpec}`}>{props}</code>}
      </h3>
      <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>{intro}</p>
      <ThemePair>{children}</ThemePair>
    </section>
  );
}

const draft =
  "Hi Aisha,\n\nThanks for checking before your renewal. You can export invoices, clients and payments from Settings → Export, as CSV with the PDFs in a zip.";
const preview = (t: Ticket) => t.body.split("\n\n")[1] ?? "";

export function ComponentsSection({ theme }: { theme: string }) {
  return (
    <>
      <Demo
        name="High confidence beside a decision"
        intro={
          <>
            Both are petrol. They should still read as different things: the meter is a bar, a
            figure and a level word with no border; the decision is a solid-bordered chip, and in
            FieldReview the line under it says in words that a person decided.
          </>
        }
      >
        <div className={styles.compare}>
          <div className={styles.compareRow}>
            <span className={`text-small ${styles.muted}`}>Category</span>
            <Chip state="decided" decidedBy="you">
              How-to
            </Chip>
          </div>
          <div className={styles.compareRow}>
            <span className={`text-small ${styles.muted}`}>Confidence</span>
            <ConfidenceMeter value={0.92} />
          </div>
          <div className={styles.inline}>
            <ConfidenceMeter value={0.92} />
            <Chip state="decided" decidedBy="you">
              How-to
            </Chip>
          </div>
        </div>
      </Demo>

      <Demo
        name="Button"
        props="variant: primary | secondary | danger · size: default | small"
        intro="Secondary is the default. Danger keeps the secondary chrome with red text, so it never outweighs Approve. Disabled is flat in every variant. Every button is fully rounded, from one token (--button-radius: 999px), as are IconButton and SegmentedControl."
      >
        {(["default", "small"] as const).map((size) => (
          <div key={size} className={styles.inline}>
            <Button variant="primary" size={size}>
              Approve and send
            </Button>
            <Button size={size}>Edit draft</Button>
            <Button variant="danger" size={size}>
              Discard draft
            </Button>
            <Button variant="primary" size={size} disabled>
              Approve and send
            </Button>
          </div>
        ))}
      </Demo>

      <Demo
        name="IconButton"
        props="icon: inbox | close | pencil · aria-label · size: default | small · tooltip"
        intro="A round secondary button holding one icon, with Button's chrome. Never Petrol: the queue's floating button is FabPanel. The name is required, since the icon has no words. Default is 32px with an 18px icon; small is 28px with a 14px icon (FieldReview's Change, last here). tooltip shows the name to its right on hover and keyboard focus: hover or tab to the pencil."
      >
        <div className={styles.inline}>
          <IconButton icon="inbox" aria-label="Open queue" />
          <IconButton icon="close" aria-label="Close queue" />
          <IconButton icon="inbox" aria-label="Open queue" disabled />
          <IconButton icon="pencil" size="small" tooltip aria-label="Change category" />
        </div>
      </Demo>

      <Demo
        name="Logo and AppHeader"
        props="AppHeader: no props"
        intro={
          <>
            The mark at 22px, then TriageDesk at 16px semibold. Its viewBox is the artwork&apos;s
            bounds, not the source file&apos;s padding, so the mark fills its box and matches the
            text. It&apos;s drawn in currentColor and colored with the accent, so it follows light
            and dark: the one brand exception to the Petrol rule. AppHeader is the header row on
            every screen: this brand on the left, the theme toggle (System, Light, Dark) on the
            right, and never a Banner. The live one is at the top of this page.
          </>
        }
      >
        <div className={styles.brandRow}>
          <p className={`text-heading ${styles.brand}`}>
            <Logo />
            TriageDesk
          </p>
          <Logo size={40} />
        </div>
      </Demo>

      <Demo
        name="Tag"
        props="tone: neutral | warning | success | ai | human"
        intro="ai is pencil (a soft gray fill, no border); human is ink (solid, petrol)."
      >
        <div className={styles.inline}>
          <Tag>Billing</Tag>
          <Tag tone="warning">Needs review</Tag>
          <Tag tone="success">Sent</Tag>
          <Tag tone="ai">Sent by rule</Tag>
          <Tag tone="human">Edited</Tag>
        </div>
      </Demo>

      <Demo
        name="Chip"
        props="state: default | suggested | decided · decidedBy | asSuggested · aiPick: boolean"
        intro="Default is an option nobody has picked. A decided chip has to say how it was decided, and the types don't allow one without: Approved as suggested shows on the chip; who set it (set by you, or kept the AI's pick) is in its accessible name only, because FieldReview's AI suggested … · n% line under it says it visibly. AI pick shows as a word on default and suggested chips, never on decided ones."
      >
        <div className={styles.chipGrid}>
          <Chip>Cancellation risk</Chip>
          <Chip aiPick>How-to</Chip>
          <Chip state="suggested">Normal</Chip>
          <Chip state="suggested" aiPick>
            How-to
          </Chip>
          <Chip state="decided" decidedBy="you">
            High
          </Chip>
          <Chip state="decided" decidedBy="Dana Ruiz" aiPick>
            How-to
          </Chip>
          <Chip state="decided" asSuggested>
            Normal
          </Chip>
        </div>
      </Demo>

      <Demo
        name="FieldReview"
        props="field · options · value · onValueChange · approved"
        intro="Reviewing one suggested field. While suggested: small secondary Keep, Use <runner-up> (short, so Keep / Use / Other fit on one line in the 320px desktop triage pane; a longer label wraps the row instead), and an Other menu for the rest of the list, so the override is one click and never competes with Approve. Once decided: the solid chip, a round pencil Change button (with a tooltip) that reopens it, and the AI suggested … · n% line, which always shows: it's the words that say a person decided. Try it; the data is LL-5040's hand-written suggestion."
      >
        <FieldReviewDemo />
      </Demo>

      <Demo
        name="Menu"
        props="label · heading · items · onSelect · size"
        intro="A button that reveals more options: its label and a 12px filled caret, never an ellipsis. The caret turns 180° while open. The menu is a popover below the button (surface-raised, popover shadow, 12px corners), left-aligned, or right-aligned if it would overflow; it sits in the top layer, so no pane clips it, and it floats over the layout instead of pushing it. Focus moves to the first item; Up and Down move; Escape closes and returns focus; a click outside or a scroll closes it. FieldReview's Other is one."
      >
        <div className={styles.inline}>
          <Menu size="small" label="Other" heading="Category" items={categories.map((c) => ({ value: c, label: c }))} onSelect={() => {}} />
          <Menu label="Other" heading="Urgency" items={urgencies.map((u) => ({ value: u, label: u }))} onSelect={() => {}} />
        </div>
      </Demo>

      <Demo
        name="NoActionReview"
        props="reason · explanation · closed · onKeep · onTriageAnyway"
        intro="The AI's suggestion that an email isn't a request: no category, urgency or draft. Still pencil until a person acts. Keep closes the ticket without a reply (the footer then reads Closed by you); Triage anyway asks the AI for a normal suggestion."
      >
        <NoActionDemo />
      </Demo>

      <Demo
        name="ConfidenceMeter"
        props="value: 0–1 · runnerUp?: 0–1 · confirmed?: boolean"
        intro={
          <>
            Confidence is the AI&apos;s estimate, not a measured probability, and every meter&apos;s
            accessible name says so. The level is derived inside, from the rounded percentage: high from{" "}
            {confidenceThresholds.high}%, medium from {confidenceThresholds.medium}%, low below. A pick
            under {confidenceThresholds.medium}% or within {confidenceThresholds.margin} points of its
            runner-up blocks Approve until a person keeps or switches it. The color follows that,
            not the band: amber while the field needs a person before Approve, Petrol when it
            doesn&apos;t. A pick that blocks only because it&apos;s a close call reads Close call
            instead of its level word, and screen readers hear &ldquo;close call with
            &lt;runner-up&gt;, confirm before approving&rdquo;. Always a bar, a figure and a word, on
            one line, with no fill.
          </>
        }
      >
        <div className={styles.stack}>
          {[0.92, 0.85, 0.71, 0.6, 0.48].map((v) => (
            <ConfidenceMeter key={v} value={v} />
          ))}
          <p className={`text-overline ${styles.muted}`}>Close call: within 15 points of the runner-up</p>
          <ConfidenceMeter value={0.71} runnerUp={0.64} runnerUpLabel="Cancellation risk" />
          <ConfidenceMeter value={0.9} runnerUp={0.8} runnerUpLabel="Billing" />
          <p className={`text-overline ${styles.muted}`}>Kept or switched by a person</p>
          <ConfidenceMeter value={0.48} confirmed />
          <ConfidenceMeter value={0.71} runnerUp={0.64} runnerUpLabel="Cancellation risk" confirmed />
        </div>
      </Demo>

      <Demo
        name="EmailBody"
        props="body · evidence"
        intro="The customer's email with the AI's quotes marked in place. Quotes that don't match the email word for word are dropped. A quote cited for both fields (the renewal date here) is marked once, in urgency red, and the evidence item under either field highlights it. Every screen uses this; none marks quotes itself."
      >
        <EmailBody
          subject={firstScreen.subject}
          body={excerpt}
          evidence={[
            ...suggestion.evidence,
            { quote: "Our renewal is on 15 December", supports: "category" },
            { quote: "Exporting all our invoices", supports: "category" },
            { quote: "a quote the email doesn't contain", supports: "category" },
          ]}
        />
      </Demo>

      <Demo name="EvidenceMark" props="supports: category | urgency" intro="The mark EmailBody and EvidenceItem use: a fill and a dashed underline, since the AI made the mark.">
        <p className="text-reading">
          Could you tell me <EvidenceMark supports="category">how to export everything we have in Ledgerline</EvidenceMark>?{" "}
          <EvidenceMark supports="urgency">Our renewal is on 15 December</EvidenceMark>.
        </p>
      </Demo>

      <Demo name="EvidenceItem" props="supports: category | urgency" intro="The quote in the evidence list, marked as it is in the email, under the word for what it supports.">
        <div className={styles.stack}>
          <EvidenceItem supports="category">how to export everything we have in Ledgerline</EvidenceItem>
          <EvidenceItem supports="urgency">Our renewal is on 15 December</EvidenceItem>
        </div>
      </Demo>

      <Demo
        name="TimelineRow"
        props="actor: ai | human"
        intro="Rows go in a Timeline, which is collapsed by default behind Activity · count (open here). The AI and team rules get a hollow ring (surface fill, ink-3 ring); a person gets a solid petrol dot and must be named. One continuous line joins the centres of the dots, whatever each row's height, and stops at the last row. A field approved untouched gets its own row, worded as approved as suggested, never as set."
      >
        <Timeline defaultOpen>
          <TimelineRow actor="ai" at="2026-11-02T16:48:00Z">
            suggested How-to at 64%, with Cancellation risk close behind
          </TimelineRow>
          <TimelineRow actor="ai" name="Team rule" at="2026-11-02T16:48:00Z">
            held it for review: below 85% and it mentions a renewal
          </TimelineRow>
          <TimelineRow actor="human" name="Dana Ruiz" at="2026-11-02T16:52:00Z">
            set the category to Cancellation risk
          </TimelineRow>
          <TimelineRow actor="human" name="Dana Ruiz" at="2026-11-02T16:55:00Z">
            approved the urgency as suggested: Normal
          </TimelineRow>
        </Timeline>
      </Demo>

      <Demo name="Banner" props="tone: info | warning | error" intro="Info is gray, not petrol, with a hairline ring so it stands out on a white card. The title says the tone in words and the fill carries the color, so no tone has a colored edge.">
        <div className={styles.blocks}>
          <Banner title="Sent by rule">This reply went out without review under the how-to team rule.</Banner>
          <Banner tone="warning" title="Approve is blocked" action={<Button size="small">Use runner-up</Button>}>
            The top two categories are 0.07 apart, below the 0.15 margin.
          </Banner>
          <Banner tone="error" title="Today's live AI limit is used up" action={<Button size="small">Try a recorded email</Button>}>
            Paste-your-own is back tomorrow. The recorded examples still work.
          </Banner>
        </div>
      </Demo>

      <Demo
        name="QueueItem"
        intro="Content props only. 12px inline padding, in a Pane with inset=list (4px), so item text and group headings start where the Queue title does and the fill has 4px on each side. The open ticket has a petrol tint, with its secondary text stepped up to ink-2. A tag that repeats its group's heading is left out (no Needs review under Needs review); Sent by rule and Closed always stay."
      >
        <Pane title="Queue" meta="2 tickets" inset="list">
          <div className={styles.queue}>
            <p className={`text-overline ${styles.muted} ${styles.groupTitle}`}>Needs review</p>
            <QueueItem
              current
              sender={firstScreen.from.name}
              company={firstScreen.account?.company}
              subject={firstScreen.subject}
              preview={preview(firstScreen)}
              receivedAt={firstScreen.receivedAt}
            />
            <p className={`text-overline ${styles.muted} ${styles.groupTitle}`}>Sent</p>
            <QueueItem
              sender={autoSent.from.name}
              company={autoSent.account?.company}
              subject={autoSent.subject}
              preview={preview(autoSent)}
              receivedAt={autoSent.receivedAt}
              meta={<Tag tone="ai">Sent by rule</Tag>}
            />
          </div>
        </Pane>
      </Demo>

      <Demo
        name="DraftEditor"
        props="state: suggested | edited | approved | sent-by-rule · blocker · warning"
        intro="Suggested is the AI's untouched draft: a soft gray fill with no border, like any suggestion. Type in it and it turns edited, with a solid border. Approved is read-only in the decided style. The note keeps saying who drafted it."
      >
        <DraftEditor label="Draft reply" state="suggested" rows={3} note="Drafted by AI" defaultValue={draft} />
        <DraftEditor label="Draft reply" state="edited" rows={3} note="Drafted by AI, edited by you" defaultValue={draft} />
        <DraftEditor label="Reply" state="approved" rows={3} note="Drafted by AI, approved by you at 16:55" defaultValue={draft} />
        <DraftEditor
          label="Draft reply"
          state="edited"
          rows={3}
          note="Drafted by AI, edited by you"
          warning="The draft was written for How-to; the category is now Cancellation risk. Check it still fits."
          defaultValue={draft}
        />
        <DraftEditor
          label="Draft reply"
          state="suggested"
          rows={3}
          note="Drafted by AI"
          blocker={demoBlockers.find((b) => b.target === "draft")?.message}
          defaultValue={suggestion.draft}
        />
        <DraftEditor label="Reply" state="sent-by-rule" rows={3} note="Drafted by AI, sent by rule without review" defaultValue={draft} />
      </Demo>

      <Demo
        name="Pane"
        props="title · meta · footer · inset: default | list"
        intro="A gray tray holding the header and wrapping a white card, with concentric corners (14px tray, 10px card). The title starts exactly where the content does, 20px from the tray's edge. The footer stays pinned at the bottom of the card while the content scrolls. inset=list (the queue) insets the content 4px for rows that carry their own 12px padding. Screens never build their own."
      >
        <Pane title="Email" meta={<span className="text-mono-small">LL-5040</span>}>
          <p className="text-reading">Could you tell me how to export everything we have in Ledgerline?</p>
        </Pane>
        <Pane
          title="Triage"
          footer={<ApproveBar blockers={demoBlockers} targets={{}} onApprove={() => {}} sentAt={null} afterSend="next-ticket" onAfterSend={() => {}} />}
        >
          <p className="text-small">The triage pane puts ApproveBar in its footer.</p>
        </Pane>
      </Demo>

      <Demo
        name="ApproveBar"
        props="blockers · targets · sentAt · afterSend: next-ticket | back-to-inbox"
        intro="Approve, with a one-line summary of what blocks it; each item jumps to where it's fixed, and the reason is shown there (a low field's amber meter, the draft's highlighted placeholders), not in a list. After sending: the sent line (by you, or by rule), and Next ticket in the inbox or Back to inbox for a ticket opened on its own."
      >
        <div className={styles.blocks}>
          <ApproveBar blockers={demoBlockers} targets={{}} onApprove={() => {}} sentAt={null} afterSend="next-ticket" onAfterSend={() => {}} />
          <ApproveBar blockers={[]} targets={{}} onApprove={() => {}} sentAt={null} afterSend="next-ticket" onAfterSend={() => {}} />
          <ApproveBar blockers={[]} targets={{}} onApprove={() => {}} sentAt="2026-11-02T16:55:00Z" afterSend="next-ticket" onAfterSend={() => {}} />
          <ApproveBar blockers={[]} targets={{}} onApprove={() => {}} sentAt="2026-11-02T16:55:00Z" afterSend="back-to-inbox" onAfterSend={() => {}} />
          <ApproveBar blockers={[]} targets={{}} onApprove={() => {}} sentAt="2026-11-02T16:31:20Z" sentBy="rule" afterSend="next-ticket" onAfterSend={() => {}} />
        </div>
      </Demo>

      <Demo
        name="Time"
        props="dateTime"
        intro="In the viewer's time zone: the time alone if it's today, the date and time if it's older, and the full timestamp with its zone on hover. Hover these."
      >
        <div className={styles.inline}>
          <Time dateTime={firstScreen.receivedAt} />
          <Time dateTime="2025-12-31T23:30:00Z" />
        </div>
      </Demo>

      <Demo
        name="FabPanel"
        props="open · onOpenChange · title · icon · onOpened? · id? · navButton? (FabPanelHeaderButton: ref · open · onOpenChange · title · icon · controls)"
        intro="The queue's entry point below 1200px: a 44px round Petrol button fixed 16px from the bottom right, and the panel it opens 12px above it. At the very top of the page it's extended, the inbox icon and Queue; any scroll down collapses it to the icon, the label sweeping out right to left before the width shrinks; back at the top it widens and the label fades in. Opening, it collapses, the icon turns into a ×, and the panel grows from its bottom-right corner (340ms) over a scrim; closing, it simply fades out (180ms). The one button stays on top and is the close; a scrim tap, Escape or a pick closes it too. Focus moves into the panel and back to the button. On phones the panel is as wide as the panes; from 768px it's 380px and up to 640px tall. In the inbox, tablets use a 32px header button instead (FabPanelHeaderButton), with the panel opening below the header across both panes."
      >
        <FabPanelDemo />
      </Demo>

      <Demo
        name="Severity"
        props="level: urgent | high | normal | low"
        intro="Only urgent is a solid fill. The bars repeat the level without color, and the word is always there."
      >
        <div className={styles.inline}>
          {(["urgent", "high", "normal", "low"] as const).map((level) => (
            <Severity key={level} level={level} />
          ))}
        </div>
      </Demo>

      <Demo
        name="SegmentedControl"
        props="options: { value, label, icon? }"
        intro="Arrow keys move and select, like native radios. Fully rounded; the selected option is neutral (raised like a secondary button), never petrol. With icons, each label becomes the option's name and only the icon shows: ThemeToggle, at the top of this page, is this with a monitor, a sun and a moon."
      >
        <div className={styles.inline}>
          <SegmentedControl
            aria-label="Inbox filter"
            options={[
              { value: "review", label: "Needs review" },
              { value: "rule", label: "Sent by rule" },
              { value: "all", label: "All" },
            ]}
          />
          <SegmentedControl
            aria-label="Theme (demo)"
            options={[
              { value: "system", label: "System", icon: "monitor" },
              { value: "light", label: "Light", icon: "sun" },
              { value: "dark", label: "Dark", icon: "moon" },
            ]}
          />
        </div>
      </Demo>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Contrast</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          New pairs the components add, measured in the page theme. Switch the theme at the top to
          check the other one.
        </p>
        <ContrastTable pairs={pairs} theme={theme} />
      </section>
    </>
  );
}
