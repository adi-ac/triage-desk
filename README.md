# Triage Desk

An AI support-ticket triage tool for a B2B SaaS help desk, built as a portfolio project about human-in-the-loop design.

Paste in a customer email and Claude suggests a category, an urgency level and a draft reply. A support agent reviews every suggestion, overrides what's wrong and approves the reply. Nothing goes out without a person signing off.

## What it shows

- **Pencil vs. ink.** AI suggestions are drawn as dashed "pencil" chips. Anything a person sets, confirms or approves becomes solid "ink," so it's always clear who decided what.
- **Confidence gates.** Each pick shows Claude's own confidence. Below 60%, approval is blocked until the agent confirms or switches to the runner-up.
- **Evidence.** Each suggestion cites the lines it was based on. Hovering a quote highlights it in the email, and quotes that don't match the email word for word are dropped.
- **Placeholders, not guesses.** Facts Claude can't know are left as `[placeholders]`, and the reply can't be approved until they're filled.
- **Not enough to go on.** When an email is too vague, Claude drafts a clarifying question instead of an answer.
- **Stale-draft warning.** Overriding the category or urgency flags that the draft was written for the old values and offers a rewrite.
- **Activity timeline and ratings.** Every decision is logged in the ticket thread. Agents rate each AI draft, and the top bar tracks how often Claude's picks are kept as-is.

## Running it

It's a single self-contained `index.html` with no build step. Open it in a browser.

Live AI triage runs when the page is published as a Claude artifact, where it calls Claude through the artifact's `sample` capability. Opened anywhere else, it runs in demo mode: the five example tickets come with precomputed suggestions, and new tickets can be triaged by hand.

The example tickets use a fictional company, Ledgerline, and invented customers.
