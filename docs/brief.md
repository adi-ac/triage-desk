# Triage Desk: product brief

From a product-thinking interview on 2026-11-02. The interview covered why the piece exists, what to build and how to test it. It stopped before the last phase, how it wins.

## The one good idea

The interface makes it obvious when the model shouldn't be trusted.

Making every human decision visible ("pencil vs. ink") is how that works, not a second idea to pitch alongside it.

## Who it's for

The design lead or head of design at a mid-size B2B SaaS company adding AI to a workflow where people make decisions all day: support, sales ops, finance ops. Intercom, Plain and Front are stand-ins, not targets yet.

Their bad moment: portfolio after portfolio with an "AI copilot" case study that's a chat sidebar on a perfect mockup. They can't tell whether the candidate has thought about what happens when the model is wrong, unsure or missing information, so they skim for a minute and close it.

Their workaround: filtering for candidates who've shipped AI features. That proxy is crude, and it rules out designers who haven't shipped AI yet. This piece has to give the same signal faster and more reliably than the proxy.

## Why this instead of a shipped case study

A shipped case study tells them about decisions after the fact, usually under NDA, with the edge cases shaped by a team and a deadline. This is a working tool they can try to break in the first minute. Every failure-mode decision in it is mine, and they can check it rather than take my word for it.

What it can't claim is real-world use, so it gets tested with support agents and the write-up shows what broke.

## Decisions

**First screen**
- The link opens straight onto a ticket where the model is unsure. Approve is blocked with the reason beside it, the runner-up is offered, and the evidence is highlighted in the email. There are zero steps to the idea and one click to override.
- The example tickets are real outputs recorded from the model and labelled as recorded. An unlabelled canned example would undo the honesty claim the piece rests on.

**Minute two**
- Visitors can paste their own email, which calls a live model through my backend. There's a per-visitor limit and a daily spend cap. When the cap is hit, the page says so and falls back to the recorded examples.

**Where automation stops**
- Auto-send above a confidence threshold breaks in B2B support. One confident but wrong answer about a billing change or a data export can cost the account, and confidence doesn't measure what's at stake.
- The line is drawn on stakes first, then confidence. Teams set rules for what may be sent without review (for example, how-to questions above 85% confidence with no billing or account data). Anything touching money, contracts, access or customer data always needs a person.
- Every ticket shows which side of the line it falls on and why.
- One ticket in the inbox went out without review under a team rule. It shows the rule that allowed it, an entry in the activity timeline and an undo window. **If I can't build that well, I cut the stakes-line claim instead of describing it.**

**What it's not leading with**
- The system underneath (trust signals as tokens and typed components, so "AI suggested vs. person decided" holds on every screen by construction). It rewards someone in minute ten, but nobody opens a repo in a sixty-second skim.

**Look** (decided 2026-11-02 in a throwaway tuning page at `/prototype/look`, now deleted)
- Accent: Petrol, hue 215. Light mode uses `petrol-700` for the accent and `petrol-100` for its soft fill; dark mode uses `petrol-300` and `petrol-900`.
- Greys: neutral, with no tint (chroma 0).
- Fonts: Schibsted Grotesk for headings, Geist for body text, Geist Mono for IDs, times and figures.
- Palette method unchanged: one lightness table for every ramp, one chroma target per step, capped at 95% of each hue's sRGB ceiling. Status colours stay amber 65, red 27 and green 150.
- Contrast: all 41 checked pairs pass WCAG AA and APCA in both themes. Neutral greys left dark-mode `ink-3` on `surface-2` at Lc 59.9, so dark `ink-3` moved to a new `grey-275` (L 0.78, Lc 61.7).
- Replaced: the v1 look of teal 192 with greys tinted toward teal, set in Bricolage Grotesque, IBM Plex Sans and IBM Plex Mono. The other accents on the panel (Pine, Blue, Indigo, Violet, Plum) and the cool and warm greys were also not chosen. Reasons weren't recorded during the session.
- Known trade-off: a violet accent and warm greys each failed one dark-mode pair on the panel; neither was picked, so neither needed fixing.

**Surfaces** (decided 2026-11-03 in a throwaway tuning page at `/prototype/surfaces`, now deleted, referencing Clerk's dashboard)
- Three elevation levels, no more: panes, popovers and menus, dialogs. Shadows and button fills are in `styles/elevation.css`; the new surface roles (`page`, `tray`, `surface-raised`, `scrim`) are in `theme.css`.
- Tray and card: a grey band holds each pane's header and wraps a white card. The page behind it is white in light mode.
- Shadows: a tight layer under the edge plus a wide soft one, at 0.7× the prototype's starting softness and 0.9× its strength. No hairline ring in light mode.
- Buttons are raised. Secondary buttons have an edge and the pane shadow. The primary button has a gradient (the accent with 12% white at the top), a lighter top edge, a darker accent ring and the pane shadow. Text on the gradient's lightest point is 5.46:1 / Lc 82 in light and 10.4:1 / Lc 69 in dark.
- Disabled buttons are flat at every depth and sunk to `bg`, so the blocked Approve doesn't look pressable.
- Dark mode has no shadows. Levels step lighter (`surface` for panes, `grey-950` for popovers and dialogs) and carry white hairline rings. The panel's hairline switch was off, which also dropped the dark rings; they were kept because the rule for dark mode was lighter surfaces and borders.
- Not chosen: decisions a person made sitting raised while AI suggestions stay flat. Both stay flat; a decision has a solid `line-strong` border and a suggestion a dashed one. Reasons weren't recorded.

## Chain of must-be-trues

1. **← testing now.** A design lead opens the link and, within 60 seconds and with no instructions, sees the model be unsure and the interface stop it: Approve blocked, the reason beside it, the runner-up offered.
2. They conclude "this person designs for when the AI is wrong, and has a view on where automation should stop", not "nice demo".
3. That's a stronger signal than "has shipped AI", so they'll talk to me without shipped AI work. This is the link I'm least sure of.
4. In the interview, the depth holds up: why the line is drawn on stakes before confidence, the system underneath, and what broke when support agents used it.

### Test for link 1

As soon as the first screen works, before any polish, three people open the link cold on a call. I stay quiet for the first minute, then ask "What do you think this person cares about?"

- **Pass:** at least two of three mention, without prompting, the model being unsure or the interface catching it.
- **Fail:** I fix the first screen before building anything else.

## Biggest unanswered risk

**Link 3.** Will a design lead talk to me without shipped AI work, on the strength of this piece? The only way to find out is with real hiring managers, and the test isn't designed yet.

Proposed shape for the test (not yet agreed):
- Send it only to companies with an open product design role on an AI workflow, through an application or a warm intro, never a cold DM.
- Use a separate link per recipient, so "never opened" is distinguishable from "opened and passed", along with how long they stayed.
- Baseline: my response rate on the last ten applications with my old portfolio.
- Agree the pass mark before sending, for example at least twice the baseline among people who opened it.
- If they open it, stay more than a minute and don't reply, links 2 or 3 failed, not distribution. Ask two of them why.

## This month (November 2026)

**Build at 100%: link 1.**
- The first screen: the unsure ticket, blocked Approve with its reason, the runner-up, evidence highlighted in the email.
- Recorded examples, labelled as recorded.
- Then run the cold-open test, and fix the first screen until it passes.

**Half-build on purpose.**
- The auto-sent ticket: one ticket, the rule, the timeline entry, undo. Enough to be real, not a rules editor.
- Paste-your-own with the live model: working, rate-limited, spend-capped, no polish.
- The token and component system: it should exist and be consistent, but don't polish it before link 1 passes.
- Visual polish and motion: after link 1 passes.

**Not this month.**
- Testing with support agents. That's link 4, and it can't rescue a failed link 1.

## Principles the idea currently violates

- **4. A named person.** The audience is a role with stand-in companies. No real design lead has been named to put this in front of.
- **6. One good idea.** Link 1 as first written put the unsure ticket and the auto-sent ticket "in the same view", which is two stories in sixty seconds. Show the auto-sent ticket as a small "Sent by rule" marker in the inbox that opens on a click, not as a competing focal point.
- **5. Signal, not finding.** If the three link-1 testers are friendly designers, a pass means little. At least one should be someone who hires designers, and none should be invested in me doing well.
- **14. Engineer out every excuse.** The link-3 test has no channel, measurement or pass mark yet, so a weak result can be explained away.

## What the interview didn't resolve

- **Who the three link-1 testers are.**
- **The link-3 test design.** Above is a proposal, not a decision.
- **The first real design lead** to send it to, by name.
- **How it wins (phase 4), not covered at all.** Where the link lives and who sees it (portfolio, applications, posts), the positioning against other AI portfolio pieces, and what happens when helpdesk products ship this pattern themselves.
- **Real, messy input.** The example emails are invented (a fictional company, Ledgerline). Real support email has forwarded chains, signatures, several asks at once, and quoted replies that may break word-for-word evidence matching. Not discussed.
- **Which vague email reliably gets an unsure result** in minute two, so a skeptical reviewer sees the system catch a case I didn't choose for them.
- **Whether the unsure examples are actually unsure.** Before building the triage panel, run LL-5040 and the vague email (`vagueEmail` in `fixtures/tickets.ts`) against the live model several times and confirm they come back unsure every time.
- **Pencil and evidence colours.** The look prototype reused `accent-soft` and `warning-soft` for evidence highlights and drew pencil with a dashed `line-strong` border. Neither has its own token yet.
- **Focus ring colour.** `theme.css` says the accent is for focus rings; the prototype used `ink`, following the polish rule that focus rings stay neutral. Pick one.
- **Long emails.** v1 cut emails off at 8,000 characters before sending them to the model, which loses the last section of LL-5033. Raise the limit, and when an email is still cut off, show the agent a note saying so.
