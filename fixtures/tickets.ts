/**
 * Example support emails sent to Ledgerline, the fictional B2B invoicing
 * product Triage Desk demos against. Every company, person and address is
 * invented; domains use .example.
 *
 * These are inputs only. Categories, urgencies, drafts and recorded model
 * outputs are kept separately, so nothing here can be mistaken for an answer.
 */

export type Ticket = {
  id: string;
  from: { name: string; email: string };
  /** The Ledgerline account the sender belongs to. Null when the sender doesn't match one. */
  account: { company: string; plan: string } | null;
  /** ISO 8601, UTC. */
  receivedAt: string;
  subject: string;
  body: string;
  /** What this ticket is here to test. For developers only; never sent to the model. */
  exercises?: string[];
};

/** An email the visitor pastes in, rather than one already in the inbox. */
export type PastedEmail = {
  name: string;
  subject: string;
  body: string;
};

/**
 * The ticket the first screen opens on. The model should be unsure between
 * How-to and Cancellation risk, and between Normal and High urgency.
 */
export const firstScreenTicketId = "LL-5040";

/**
 * The ticket shown as "Sent by rule": a how-to question with nothing touching
 * money, contracts, access or customer data.
 */
export const autoSendTicketId = "LL-5039";

/**
 * Pasted by the "Try a vague email" button. "Invoice" is ambiguous in an
 * invoicing product: it could be Ledgerline's bill (Billing) or the
 * customer's own invoices to their clients (Bug), and nothing says how urgent
 * it is or who's affected.
 */
export const vagueEmail: PastedEmail = {
  name: "Sam",
  subject: "invoice amounts",
  body: `Hi,

The amounts on last month's invoice don't look right. Can someone check?

Thanks,
Sam`,
};

export const tickets: readonly Ticket[] = [
  {
    id: "LL-5040",
    from: { name: "Aisha Kamara", email: "aisha.kamara@fernhillvets.example" },
    account: { company: "Fernhill Veterinary Partners", plan: "Growth plan · 18 seats" },
    receivedAt: "2026-11-02T16:48:00Z",
    subject: "Exporting all our invoices and client records",
    body: `Hi,

Could you tell me how to export everything we have in Ledgerline? I mean all invoices since we started in 2023, the client list with contact details, and the full payment history, ideally including the PDFs and any attachments.

I'd also like to know whether the API can pull the same history, or whether the CSV export is the only route.

For context, our new finance director starts in January and has asked every team to document how our systems fit together before she decides on next year's tools. Our renewal is on 15 December, so it would help to know what's possible in the next couple of weeks.

Thanks,
Aisha Kamara
Practice Operations Manager
Fernhill Veterinary Partners`,
    exercises: [
      "First screen: How-to vs. Cancellation risk",
      "Urgency hinges on a renewal date, not a stated problem",
    ],
  },
  {
    id: "LL-5039",
    from: { name: "Tom Becker", email: "tom@beckerhale.example" },
    account: { company: "Becker & Hale Joinery", plan: "Starter plan · 2 seats" },
    receivedAt: "2026-11-02T16:31:00Z",
    subject: "How do I add our logo to invoices?",
    body: `Hi there,

We've just had a new logo designed and I'd like it to appear at the top of the invoices we send. Where do I upload it?

Thanks,
Tom`,
    exercises: ['Qualifies for "Sent by rule": how-to, no billing or account data'],
  },
  {
    id: "LL-5038",
    from: { name: "Kieran Dunmore", email: "kieran@dunmoreplumbing.example" },
    account: { company: "Dunmore Plumbing & Heating", plan: "Starter plan · 3 seats" },
    receivedAt: "2026-11-02T16:05:00Z",
    subject: "",
    body: "it's broken again",
    exercises: ["Body is three words", "Empty subject", "Refers to history the model can't see"],
  },
  {
    id: "LL-5037",
    from: { name: "Gary Pruitt", email: "gary@pruittfleet.example" },
    account: { company: "Pruitt Fleet Services", plan: "Growth plan · 11 seats" },
    receivedAt: "2026-11-02T15:52:00Z",
    subject: "WHY ARE MY CUSTOMERS GETTING PAYMENT REMINDERS FOR INVOICES THEY ALREADY PAID",
    body: `I HAVE NOW HAD FOUR CUSTOMERS CALL ME THIS MORNING ASKING WHY THEY ARE GETTING "FINAL NOTICE" EMAILS FROM US FOR INVOICES THEY PAID WEEKS AGO. THE PAYMENTS ARE IN LEDGERLINE. THE INVOICES SAY PAID. AND YOUR SYSTEM IS STILL SENDING THEM REMINDERS.

THIS IS THE THIRD TIME SINCE AUGUST. LAST TIME I WAS TOLD IT WAS FIXED.

ONE OF THESE CUSTOMERS IS A COUNTY CONTRACT. DO YOU UNDERSTAND WHAT IT LOOKS LIKE WHEN WE SEND A FINAL NOTICE TO A COUNTY THAT PAID ON TIME.

TURN OFF THE REMINDERS ON MY ACCOUNT RIGHT NOW UNTIL THIS IS FIXED, AND SOMEONE CALL ME TODAY. IF THIS HAPPENS AGAIN WE ARE MOVING TO SOMETHING ELSE.

GARY PRUITT
OWNER, PRUITT FLEET SERVICES
(555) 014-2290`,
    exercises: ["All caps, angry", "Bug with a cancellation threat attached", "Draft must not match the shouting"],
  },
  {
    id: "LL-5036",
    from: { name: "Lucía Herrera", email: "lherrera@herrerahermanos.example" },
    account: { company: "Distribuidora Herrera Hermanos", plan: "Growth plan · 6 seats" },
    receivedAt: "2026-11-02T15:20:00Z",
    subject: "Error en el cálculo del IVA en facturas con descuento",
    body: `Hola,

Desde hace dos semanas, las facturas que llevan un descuento calculan el IVA sobre el subtotal antes del descuento, no después. Por ejemplo, en la factura FAC-2026-0912 el subtotal es de $18,400.00 con un descuento del 10% ($1,840.00), y el IVA del 16% sale en $2,944.00 cuando debería ser $2,649.60.

Nuestro contador detectó la diferencia en 23 facturas de octubre. Ya enviamos varias a clientes, y dos de ellos nos pidieron facturas corregidas.

¿Pueden revisarlo? Necesitamos saber si es un error del sistema o una configuración nuestra antes del cierre del mes, que es el día 5.

Saludos,
Lucía Herrera
Administración
Distribuidora Herrera Hermanos
Guadalajara, Jal.`,
    exercises: ["Spanish", "Draft should reply in Spanish", "Evidence quotes must stay in Spanish, word for word"],
  },
  {
    id: "LL-5035",
    from: { name: "Nadia Petrov", email: "nadia.petrov@greywell.example" },
    account: { company: "Greywell Analytical Labs", plan: "Scale plan · 26 seats" },
    receivedAt: "2026-11-02T14:47:00Z",
    subject:
      "Invoice numbers jumped from INV-2026-0418 to INV-2026-1000 after last week’s update and our auditor wants an explanation",
    body: `Hello,

Since Thursday our invoice numbers have jumped. The last invoice we sent on Wednesday was INV-2026-0418, and the next one, on Thursday, came out as INV-2026-1000. As far as I can tell, nobody here changed the numbering settings.

Our auditor needs a sequential series with an explanation for any gap. Can you tell me what happened, whether 0419 to 0999 can still be used, and how to put it in writing for the audit file?

Best regards,
Nadia Petrov
Finance Manager, Greywell Analytical Labs`,
    exercises: ["Subject is exactly 120 characters", "Curly apostrophe in the subject"],
  },
  {
    id: "LL-5034",
    from: { name: "Rhiannon Brannigan", email: "rhiannon@obvl-refrigeration.example" },
    account: {
      company: "Okonkwo, Brannigan & Vasquez-Lindholm Commercial Refrigeration Pty Ltd",
      plan: "Growth plan · 7 seats",
    },
    receivedAt: "2026-11-02T14:20:00Z",
    subject: "Giving our accountant access",
    body: `Hi,

Our external accountant (Dev at Pillar & Post Accounting) needs to see our invoices and payments for the quarterly BAS. Can I give him read-only access without using one of our paid seats? I don't want him able to edit or send anything.

Cheers,
Rhiannon Brannigan
Office Manager`,
    exercises: ["Company name is exactly 70 characters", "Account & access vs. How-to vs. Billing (seats)"],
  },
  {
    id: "LL-5033",
    from: { name: "Maggie Szabo", email: "mszabo@halvorsenmarine.example" },
    account: { company: "Halvorsen Marine Supply", plan: "Growth plan · 7 seats" },
    receivedAt: "2026-11-02T13:58:00Z",
    subject: "Our first two months on Ledgerline: a long list, sorry",
    body: `Hi Ledgerline team,

I've been meaning to write this for a few weeks and kept putting it off because I knew it would turn into an essay. It has. Sorry in advance. I've numbered everything so whoever picks this up can split it between people if that's how you work, and I've put what matters most to us at the bottom.

Some context first, so the rest makes sense. I'm the financial controller at Halvorsen Marine Supply. We sell chandlery, rigging, paint and engine parts to boatyards, marinas, yacht clubs and a few hundred private boat owners, from three warehouses in Portsmouth NH, Mystic CT and Annapolis MD. We moved our invoicing to Ledgerline at the start of September, off a combination of our old ERP's invoicing module and, honestly, a lot of Excel. Seven of us use it day to day: me, our two AR clerks (Denise and Paulo), our three branch managers, and our owner, Erik Halvorsen, who mostly looks at the dashboard and occasionally does things he shouldn't (more on that in point 8).

Overall the move has been a real improvement, and I want to say that up front because the rest of this email is a list of problems. Invoices go out the same day instead of in a weekly batch. The client portal has cut the "can you resend that invoice" calls to almost nothing. Card payments through Stripe reconcile far better than our old terminal ever did, and Denise says she's spending about a day a week less on chasing. So please don't read this as regret. It isn't. But we have a quarter-end in a few weeks and our year-end audit starts in February, and I need these sorted, or at least understood, before either.

1. Sales tax rounding on multi-line invoices

Ledgerline seems to calculate sales tax on each line and round it, then add the rounded amounts together. Our old system calculated tax on the invoice subtotal and rounded once. On a typical invoice with fifteen or twenty lines, that gives a difference of one to three cents. It sounds trivial, and on any one invoice it is, but across the 1,100 or so invoices we sent in October the total difference comes to $14.27, and it doesn't match what our tax software expects when we file.

Two questions. First, is there a setting to calculate tax at the invoice level instead of the line level? I've looked through the tax settings and can't find one. Second, if there isn't, can you tell me exactly how Ledgerline does it, including the rounding rule (half up, half even, something else), so I can document it for the auditors and set our tax software to match? I'd rather have a written answer from you than a guess from me.

2. Duplicate client records from the import

When we imported our client list in September, about sixty clients came in twice, because the old ERP had them under slightly different names. For example, we now have "Spinnaker Yacht Club" and "SPINNAKER YACHT CLUB INC", and "Bayside Marina" and "Bayside Marina LLC". Both versions have invoices against them, and some have payments.

I can't find a way to merge two client records. I'm nervous about deleting one, because I don't know what happens to the invoices and payments attached to it, and some of these clients have already set up logins to the client portal. What's the safe way to merge them so the history ends up in one place, and will merging break anyone's portal login? If there's no merge feature, is there a workaround you'd recommend, even a slow one? Paulo is happy to do sixty of them by hand if he knows the steps won't lose anything.

3. Recurring invoices for marina maintenance contracts

This is the one that worries me most. We have forty marinas on monthly maintenance contracts, and we set each one up as a recurring invoice on the 1st of the month. In October, three of them went out on the 2nd instead of the 1st, which I could live with, but one, Harbor Point Marina, didn't go out at all. The activity log for that recurring invoice says "Skipped" for October with no reason given. The schedule hasn't changed, the client record hasn't changed, and the card on file is valid.

We only found out because Harbor Point's office manager called on the 20th to ask where their invoice was. They're one of our largest accounts, and it was embarrassing to have them notice before we did. November's run on Sunday looked fine as far as I can tell, but I don't trust it yet.

Can you tell me why October's was skipped, and whether there's a way to get an alert when a recurring invoice is skipped or delayed? Even an email to me would do. I'd much rather hear it from Ledgerline than from a client.

4. Approval before large invoices go out

Our branch managers create invoices for their own customers, which is how we want it. But we'd like anything over $10,000 to need my approval before it's sent. At the moment we rely on the managers remembering to check with me, and they mostly do, but "mostly" is exactly what our auditors flagged in last year's management letter.

Is there a way to set this up? I've looked at roles and permissions and couldn't see anything. If it isn't possible, please treat this as a feature request, and I'd be grateful to know whether something like it is on your roadmap, because it affects how I answer the auditors.

5. Card surcharge

Where state law allows it, we pass a 3% surcharge on to clients who pay by card. Right now the clerks add it as a manual line item, and they forget about half the time, which means we either eat the fee or have to send a corrected invoice, and clients hate corrected invoices.

Is there a way to apply a surcharge automatically only when a client pays by card, and only for clients in certain states? If it can't be done per state, could it be turned on per client? I'd settle for that.

6. Reporting by branch

We've been tagging every invoice with its branch (PORTSMOUTH, MYSTIC, ANNAPOLIS) so we can report revenue by location. The invoice list filters by tag, which is great, but the AR aging report doesn't, so I can't see overdue balances for one branch at a time. Each branch manager is responsible for collections at their own branch, so at the moment I export the whole aging report and split it by hand in Excel every Monday, which is exactly the kind of thing we moved to Ledgerline to stop doing.

Is there a way to filter the aging report by tag? Or a better way to set up branches than tags, if we've done it wrong?

7. Our own Ledgerline bill

This one is about our account rather than the product. We signed up on the Growth plan, monthly, with seven seats. Our October invoice from you charged us for nine seats. I think I know why: in the second week of September we added two temporary clerks to help with the import and removed them about ten days later. But I'd expect that to be prorated, not charged as two full seats for a full month, and certainly not to carry over into October after they were removed.

Could someone look at it and explain the charge? If it's wrong, I'd appreciate a credit on the next invoice. Separately, could you send me the price for the same plan billed annually? If the numbers work, we'd consider switching at the end of the year.

8. Permissions

Two things here. First, our branch managers can see every client across all three branches. That's not a disaster, but I'd prefer each of them to see only their own branch's clients and invoices, partly for tidiness and partly because a couple of our clients are commercially sensitive. Is that possible?

Second, our owner, Erik, has a full admin role because he's the owner and it felt wrong to give him anything less. Last month he edited an invoice after it had been sent, to fix what he thought was a typo in a price, and the client received an updated invoice with a different total and no explanation. It took two days and a phone call to untangle. I'd like him to have view-only access, but I need a way to explain that which doesn't sound like I'm taking his toys away. Is there a role that can see everything, including reports and the dashboard, but can't create or edit invoices?

9. Statements for clients with many open invoices

A lot of our marina clients have fifteen or twenty open invoices at any one time, because they order parts for different boats throughout the month. Their accounts teams have asked, more than once, for a single monthly statement that lists every open invoice with its balance, rather than fifteen separate reminder emails. Our old ERP did this, badly, but it did it, and it was the one thing the marinas actually liked about it.

I can see each client's open invoices in their client record, and I can export them, but I can't find a way to send a statement from Ledgerline itself. At the moment Denise builds one in Excel for our six biggest clients at the start of each month, and the rest just get the individual reminders.

Is there a statement feature I've missed? If not, is there a way to send one reminder per client that covers all their overdue invoices, instead of one email per invoice? Two of the marinas have told us the volume of reminders is the reason they've stopped reading them, which defeats the purpose. For what it's worth, the format doesn't need to be fancy: client name, invoice number, date, due date, original amount, amount paid and balance, with a total at the bottom and a link to pay. If neither exists, please add it to the feature request pile with point 4.

10. A few smaller things

These don't need an answer soon. I'm including them so they're on record.

- On the invoice PDF, when a client's name is long, the payment terms line wraps onto two lines and pushes the totals box down so it overlaps the footer. "Chesapeake Bay Yacht Restoration and Brokerage" is our worst case.
- Could reminder emails come from Denise's name rather than "Halvorsen Marine Supply via Ledgerline"? Clients reply to her anyway, and a few have told us the reminders look like spam.
- The search box doesn't find invoices by PO number, even though the PO is on the invoice. Our clients almost always quote their PO when they call.
- The CSV export of payments uses DD/MM/YYYY, but every other export uses MM/DD/YYYY. It tripped up our import into the general ledger twice before we noticed.

What matters most

If you can only get to some of this soon, the order that matters to us is:

1. Point 3, the recurring invoices, because it's already cost us with a client.
2. Point 7, our own bill, because it's simple and it's money.
3. Point 1, tax rounding, because of the audit.
4. Point 2, the duplicates, because Paulo is waiting to start.

The rest can wait until after the quarter.

One more thing, and I'll say it plainly because I think it's useful for you to know. Last week Erik asked me whether we'd made the right call moving to Ledgerline, mostly because of the Harbor Point problem. I told him yes, and I meant it. I'd like to keep being able to say that.

Happy to get on a call if that's easier than email. I'm usually free after 2pm Eastern.

Thanks for reading all of this,

Maggie Szabo
Financial Controller
Halvorsen Marine Supply
Portsmouth · Mystic · Annapolis
(555) 013-4471`,
    exercises: [
      "About 2,000 words",
      "Longer than the 8,000 characters v1 sent to the model",
      "Nine asks across Bug, Billing, How-to and Feature request",
      "Quiet cancellation signal in the last paragraph",
    ],
  },
  {
    id: "LL-5032",
    from: { name: "Hannah Whitcombe", email: "h.whitcombe@thornburyfg.example" },
    account: { company: "Thornbury Facilities Group", plan: "Scale plan · 32 seats" },
    receivedAt: "2026-11-02T13:12:00Z",
    subject: "RE: [LL-4977] Stripe payout doesn’t match invoices paid",
    body: `Hi,

Still not resolved, I’m afraid. The payout on 28 October was short by £412.80 again, and it’s the same pattern: the invoices show as paid in full, but the payout is lower than the total.

Joel’s explanation last time was card fees, but I’ve checked, and the Stripe fees for this payout come to £96.20, not £412.80. Our month-end reconciliation can’t close until I can explain the rest.

Could someone look at this properly this time? I’ve attached the payout report.

Kind regards,

Hannah Whitcombe (she/her)
Billing Operations Manager
Thornbury Facilities Group Ltd
Unit 4, Kingsmead Business Park, Thornbury, Bristol
T: +44 (0)1454 000 112 | M: +44 (0)7700 900 418
www.thornburyfg.example | LinkedIn: /company/thornbury-facilities-group

Thornbury Facilities Group Ltd is registered in England and Wales. Registered office: Unit 4, Kingsmead Business Park, Thornbury, Bristol.

CONFIDENTIALITY NOTICE: This email and any attachments are confidential and may be legally privileged. They are intended solely for the addressee. If you have received this email in error, please notify the sender immediately and delete it from your system. You must not copy, distribute or take any action in reliance on it. Thornbury Facilities Group Ltd accepts no liability for any loss or damage arising from the use of this email or its attachments.

Please consider the environment before printing this email.

We’re proud to be a Living Wage employer and a Gold Award holder in the 2025 Bristol Green Business Awards.

On Fri, 23 Oct 2026 at 14:02, Ledgerline Support <support@ledgerline.example> wrote:
> Hi Hannah,
>
> Thanks for your patience. I've looked into payout po_1QxR8 and the difference comes from card processing fees, which Stripe deducts before paying out. Your invoices show the full amount because your client paid the full amount; the fee comes out of the payout, not the invoice.
>
> You can see the fees for each payment under Payments > Payouts. Let me know if anything doesn't add up.
>
> Best,
> Joel
> Ledgerline Support
>
> On Wed, 21 Oct 2026 at 09:47, Hannah Whitcombe <h.whitcombe@thornburyfg.example> wrote:
>> Hello,
>>
>> Our Stripe payout on 20 October was £388.15 less than the invoices it covered. Every invoice in the payout is marked as paid in full in Ledgerline. Where has the difference gone?
>>
>> Hannah`,
    exercises: [
      "Long signature with legal boilerplate",
      "Quoted reply chain two levels deep",
      "Evidence should come from the new message, not the quotes",
      "Curly apostrophes",
    ],
  },
  {
    id: "LL-5031",
    from: { name: "Derek Osei", email: "derek@larkspurhire.example" },
    account: { company: "Larkspur Event Hire", plan: "Growth plan · 5 seats" },
    receivedAt: "2026-11-02T12:40:00Z",
    subject: "Fwd: Fw: Invoice INV-0311 – payment link expired",
    body: `Hi Ledgerline,

Forwarding the chain below. This is the second client this week who says the "Pay now" link on their invoice has expired. This one was only sent on the 27th. Can you see what's going on? I don't want them paying late because of us.

Derek

---------- Forwarded message ---------
From: Linda Park <lpark@marlowehotels.example>
Date: Fri, 30 Oct 2026 at 16:22
Subject: Fw: Invoice INV-0311 – payment link expired
To: Derek Osei <derek@larkspurhire.example>

Hi Derek,

See below from our AP team. Could you send a new link? We'd like to pay this before our payment run on Tuesday.

Thanks,
Linda

Linda Park | Events Coordinator | Marlowe Hotels

From: Accounts Payable <ap@marlowehotels.example>
Sent: Friday, October 30, 2026 3:58 PM
To: Linda Park <lpark@marlowehotels.example>
Subject: Invoice INV-0311 – payment link expired

Linda,

The link on the Larkspur invoice (INV-0311, $6,240.00) goes to a page that says "This payment link has expired. Please contact the sender." We can't pay by card without it. Can you ask them to resend, or send bank details instead?

AP Team
Marlowe Hotels`,
    exercises: [
      "Forwarded chain: the customer is Derek, not the people quoted",
      "Customer's own client is the one blocked",
    ],
  },
  {
    id: "LL-5030",
    from: { name: "Fiona Gallagher", email: "fiona@brightseedmarketing.example" },
    account: { company: "Brightseed Marketing", plan: "Growth plan · 30 seats" },
    receivedAt: "2026-11-02T11:55:00Z",
    subject: "We’re still paying for people who’ve left",
    body: `Hi,

We removed six users in September when a team moved to our sister company, but our October invoice from Ledgerline still charges for 30 seats. We should be on 24.

I’ve double-checked the Users page and it says “24 of 30 seats used”. So it looks like the seats were freed but the plan wasn’t reduced. Can you bring us down to 24 and credit the difference for October?

Our budget review is on Thursday, and I’d like this sorted before then.

Thanks,
Fiona Gallagher
Operations Director, Brightseed Marketing`,
    exercises: ["Curly apostrophes and curly double quotes", "Billing with a deadline"],
  },
  {
    id: "LL-5029",
    from: { name: "Martin Hollis", email: "martin@hollisclarke.example" },
    account: { company: "Hollis Clarke Legal", plan: "Scale plan · 14 seats" },
    receivedAt: "2026-11-02T11:20:00Z",
    subject: "Charged twice for our annual renewal",
    body: `Hello,

Our company card was charged $4,788.00 twice on 30 October, both described as “LEDGERLINE ANNUAL”. We only have one account.

The second charge has pushed the card close to its limit, and we have supplier payments going out on that card this week. Please refund the duplicate as soon as possible and confirm by email when it’s done.

Regards,
Martin Hollis
Practice Manager, Hollis Clarke Legal`,
    exercises: ["Curly quotes", "Money going out wrong: never auto-send"],
  },
  {
    id: "LL-5028",
    from: { name: "Ines Carvalho", email: "ines@carvalhotiles.example" },
    account: { company: "Carvalho Tile & Stone", plan: "Starter plan · 2 seats" },
    receivedAt: "2026-11-02T10:44:00Z",
    subject: "Locked out – new phone, no 2FA codes",
    body: `Hi,

I got a new phone over the weekend and didn't move the authenticator app across. Now I can't log in because it asks for a code I don't have. I'm the only admin on our account.

We have about 30 invoices to send for month end and I'm stuck. What do I need to send you to prove who I am?

Ines Carvalho
Carvalho Tile & Stone`,
  },
  {
    id: "LL-5027",
    from: { name: "Owen Hartley", email: "owen@hartleyfreight.example" },
    account: { company: "Hartley Freight Forwarding", plan: "Scale plan · 19 seats" },
    receivedAt: "2026-11-02T10:02:00Z",
    subject: "URGENT: remove a former employee's admin access",
    body: `Hi,

Our former finance manager, Craig Dawson, left the company on Friday and it wasn't on good terms. He still has admin access to our Ledgerline account, and I can't remove him because he's the account owner, not me.

I need his access removed today and ownership moved to me. I'm the managing director and can verify that however you need. Please also tell me if there's a way to see what he's done in the account since Friday.

Owen Hartley
Managing Director, Hartley Freight Forwarding`,
    exercises: ["Access change requested by someone who isn't the owner: needs verification"],
  },
  {
    id: "LL-5026",
    from: { name: "Mei Lin Tan", email: "meilin.tan@orchardgrove.example" },
    account: { company: "Orchard Grove Property Management", plan: "Scale plan · 40 seats" },
    receivedAt: "2026-11-01T22:15:00Z",
    subject: "Okta SSO: new hires get 'User not assigned to this application'",
    body: `Hi team,

SSO has been working fine for our existing staff since we set it up in June. But the four people we hired this month all get "User not assigned to this application" when they try to sign in to Ledgerline through Okta.

I've checked, and they're assigned to the Ledgerline app in Okta, in the same group as everyone else. I've also added them as users in Ledgerline. Is there a step on your side I'm missing, like a domain allowlist or a seat limit?

They can't do much until they're in, so I'd appreciate a quick look.

Mei Lin Tan
IT Lead, Orchard Grove Property Management`,
  },
  {
    id: "LL-5025",
    from: { name: "Paweł Zieliński", email: "pawel@zielinski-transport.example" },
    account: { company: "Zieliński Transport", plan: "Growth plan · 8 seats" },
    receivedAt: "2026-11-01T19:40:00Z",
    subject: "Polish characters missing in invoice PDFs",
    body: `Hello,

When we download or send an invoice as a PDF, Polish letters are replaced with empty boxes. For example, our client “Przedsiębiorstwo Handlowe Łączność” appears as “Przedsi☐biorstwo Handlowe ☐☐czno☐☐”, and the city Łódź appears as “☐ód☐”.

In the editor everything looks correct. It’s only the PDF.

Several clients have asked us to resend with the correct name because their accounting systems reject the invoice. Is there a font setting we should change?

Best regards,
Paweł Zieliński
Zieliński Transport Sp. z o.o.`,
    exercises: ["Non-ASCII names and symbols inside quotes", "Curly quotes"],
  },
  {
    id: "LL-5024",
    from: { name: "Grace Mensah", email: "grace@mensahdesign.example" },
    account: { company: "Mensah Design Studio", plan: "Starter plan · 3 seats" },
    receivedAt: "2026-11-01T16:05:00Z",
    subject: "Xero sync is creating duplicate contacts",
    body: `Hi,

Since we reconnected Xero last week (it asked us to re-authorise), every invoice that syncs creates a new contact in Xero instead of matching the existing one. We now have three "Atlas Coffee Roasters" contacts in Xero, each with one invoice. Our bookkeeper is not thrilled.

How do we stop it, and is there a way to clean up the ones it's already created?

Thanks,
Grace`,
  },
  {
    id: "LL-5023",
    from: { name: "Liam Fraser", email: "liam@fernandash.example" },
    account: { company: "Fern & Ash Lighting", plan: "Growth plan · 4 seats" },
    receivedAt: "2026-11-01T11:30:00Z",
    subject: "Invoice dates are a day early on the PDF",
    body: `Kia ora,

We're based in Auckland. When I create an invoice dated 1 November, the PDF and the email to the client both say 31 October, and the due date is a day early too. The date in the editor is correct, and our account time zone is set to Pacific/Auckland.

It's not urgent, since clients haven't complained yet, but it'll confuse them when the due dates don't match our terms.

Cheers,
Liam Fraser
Fern & Ash Lighting`,
    exercises: ["Customer says it isn't urgent"],
  },
  {
    id: "LL-5022",
    from: { name: "Sofia Romano", email: "sofia@romanofitness.example" },
    account: { company: "Romano Fitness Studios", plan: "Growth plan · 6 seats" },
    receivedAt: "2026-11-01T09:12:00Z",
    subject: "Recurring membership invoices didn't go out on the 1st",
    body: `Hi,

We bill 214 members on the 1st of every month with recurring invoices. This morning only 200 went out. The other 14 show "Scheduled" with yesterday's date and haven't moved. Nothing has changed on those members' profiles as far as I can see.

Most of them pay automatically when the invoice arrives, so if they don't get it today their payments will be late, and our rent is due on the 5th. Can you push them out, or tell me how to?

Sofia Romano
Owner, Romano Fitness Studios`,
  },
  {
    id: "LL-5021",
    from: { name: "Alex Novak", email: "alex@paddockhq.example" },
    account: { company: "Paddock HQ", plan: "Scale plan · 22 seats" },
    receivedAt: "2026-10-31T21:48:00Z",
    subject: "invoice.paid webhooks stopped firing since Oct 29",
    body: `Hi,

Our integration listens for invoice.paid to unlock customer accounts after payment. Since around 14:00 UTC on Oct 29 we haven't received a single invoice.paid event, though invoice.created and invoice.sent are still arriving.

Endpoint: https://hooks.paddockhq.example/ledgerline
Webhook ID: wh_8f2c91d4
Invoices paid since then with no event: INV-20931, INV-20944, INV-20950

Our endpoint returns 200 for everything (we log every request), and the delivery log in your dashboard shows nothing for these invoices, not even failed attempts.

The last event we did receive:

{
  "type": "invoice.paid",
  "id": "evt_31c0a7",
  "created": "2026-10-29T13:52:11Z",
  "data": { "invoice_id": "INV-20928", "amount_paid": 49900, "currency": "usd" }
}

Customers are paying and not getting access, so we're unlocking them by hand for now. Can you check whether something changed on your side?

Thanks,
Alex Novak
Platform Engineer, Paddock HQ`,
    exercises: ["Code and JSON in the body", "Technical sender"],
  },
  {
    id: "LL-5020",
    from: { name: "Rosa Delgado", email: "rosa@delgadolandscaping.example" },
    account: { company: "Delgado Landscaping", plan: "Growth plan · 5 seats" },
    receivedAt: "2026-10-31T17:30:00Z",
    subject: "Invoices going to spam since we set up our own domain",
    body: `Hi,

Last week we followed your guide to send invoices from billing@delgadolandscaping.example instead of the Ledgerline address. Since then, at least five clients have told us our invoices landed in spam, and two only found them after a reminder.

Your settings page shows the domain as "Verified" with a green tick. Our IT guy says the DKIM record is there, but he isn't sure about SPF, because we already have one for Google Workspace.

Should we switch back to the Ledgerline address for now?

Rosa`,
    exercises: ["Bug vs. How-to"],
  },
  {
    id: "LL-5019",
    from: { name: "Ben Adeyemi", email: "ben@adeyemiav.example" },
    account: { company: "Adeyemi AV Solutions", plan: "Starter plan · 2 seats" },
    receivedAt: "2026-10-31T14:10:00Z",
    subject: "Recording a partial payment",
    body: `Hi,

A client paid $1,500 of a $3,000 invoice by bank transfer and will pay the rest next month. How do I record the $1,500 so the invoice shows the right balance and the reminders only chase what's left?

Thanks,
Ben`,
    exercises: ['Near miss for "Sent by rule": a how-to, but about a client\'s payment'],
  },
  {
    id: "LL-5018",
    from: { name: "Helen Brooks", email: "helen@brookshorticulture.example" },
    account: { company: "Brooks Horticultural Supplies", plan: "Growth plan · 4 seats" },
    receivedAt: "2026-10-31T10:25:00Z",
    subject: "How do I issue a credit note?",
    body: `Hello,

A customer returned part of an order (12 of 40 planters), and the invoice has already been paid. What's the right way to issue a credit for the returned items in Ledgerline? Do I edit the paid invoice or create something separate?

I don't want to mess up our VAT return.

Thanks,
Helen Brooks`,
  },
  {
    id: "LL-5017",
    from: { name: "Ruth Abernathy", email: "ruth@abernathyengineering.example" },
    account: { company: "Abernathy Structural Engineering", plan: "Scale plan · 12 seats" },
    receivedAt: "2026-10-30T20:15:00Z",
    subject: "AR aging report as of 31 October for our auditors",
    body: `Hi,

Our auditors want an accounts receivable aging report as of 31 October, broken into 0–30, 31–60, 61–90 and 90+ days, by client. I can see the aging report on the dashboard, but it only shows today's figures.

Is there a way to run it for a past date, and can it export to Excel? They need it by the 7th.

Thanks,
Ruth Abernathy
Finance Lead`,
  },
  {
    id: "LL-5016",
    from: { name: "Jasper Quinn", email: "jasper@quinnandco.example" },
    account: { company: "Quinn & Co. Creative", plan: "Starter plan · 1 seat" },
    receivedAt: "2026-10-30T15:40:00Z",
    subject: "Changing our invoice prefix for 2027",
    body: `Hi!

From 1 January we’d like our invoice numbers to start with “QC27-” instead of “QC-”, and restart at 001. Is that possible without messing up this year’s numbers?

Not urgent, just planning ahead.

Thanks,
Jasper`,
    exercises: ["Curly quotes", 'Would also qualify for "Sent by rule"'],
  },
  {
    id: "LL-5015",
    from: { name: "Chloe Martin", email: "chloe@martinbakery.example" },
    account: { company: "Martin & Daughters Bakery", plan: "Starter plan · 2 seats" },
    receivedAt: "2026-10-30T11:05:00Z",
    subject: "Can clients pay by bank transfer?",
    body: `Hi,

A few of our café clients would rather pay by bank transfer than card. Can I put our bank details on the invoice, and will Ledgerline mark the invoice as paid when the money arrives, or do I have to do that myself?

Thanks,
Chloe`,
  },
  {
    id: "LL-5014",
    from: { name: "Victor Alvarez", email: "victor@alvarezelectrical.example" },
    account: { company: "Alvarez Electrical Contractors", plan: "Growth plan · 6 seats" },
    receivedAt: "2026-10-29T22:30:00Z",
    subject: "Need a PO number field on invoices",
    body: `Hello,

Our biggest client, a hospital group, has started rejecting invoices that don't show their purchase order number in a dedicated field. Right now we type it into the notes, and their AP system doesn't pick it up.

Is there a PO field I'm missing? If not, can you add one? They've rejected three invoices this month totalling about $48,000, so this is costing us.

Victor Alvarez`,
    exercises: ["Feature request that's urgent for the customer"],
  },
  {
    id: "LL-5013",
    from: { name: "Sam Achterberg", email: "sam@greenhavengroup.example" },
    account: { company: "Greenhaven Group", plan: "Scale plan · 15 seats" },
    receivedAt: "2026-10-29T18:00:00Z",
    subject: "Two companies, one login?",
    body: `Hi,

We run two legal entities, Greenhaven Landscapes Ltd and Greenhaven Nurseries Ltd, and at the moment we have two separate Ledgerline accounts: two logins, two bills and no combined reporting.

Is there any way to manage both from one account, with separate invoice numbering and bank details for each? We're looking at a couple of tools that do this, so it would help to know if it's on your roadmap.

Thanks,
Sam`,
    exercises: ["Feature request vs. Cancellation risk"],
  },
  {
    id: "LL-5012",
    from: { name: "Nina Haddad", email: "nina@haddadconsulting.example" },
    account: { company: "Haddad Consulting", plan: "Growth plan · 10 seats" },
    receivedAt: "2026-10-29T14:20:00Z",
    subject: "Feature idea: approval before sending",
    body: `Hi Ledgerline team,

Small suggestion. We'd love an optional approval step, so junior staff can draft invoices but a partner has to approve them before they go out. At the moment we just ask people to check with us, which mostly works.

No urgency, just something we'd use.

Best,
Nina`,
  },
  {
    id: "LL-5011",
    from: { name: "Patrick Doyle", email: "patrick@doylesigns.example" },
    account: { company: "Doyle Signs & Graphics", plan: "Growth plan · 9 seats" },
    receivedAt: "2026-10-29T10:45:00Z",
    subject: "New pricing from January",
    body: `Hi,

I got your email about the new pricing. If I'm reading it right, our monthly bill goes from $186 to $261, about 40% more, for the same features.

We've been with you since 2021 and I'd like to stay, but I can't justify that to my business partner. Is there anything you can do for long-standing customers, like locking in the current price on an annual plan? Otherwise we'll have to look at other options before renewal.

Patrick Doyle`,
  },
  {
    id: "LL-5010",
    from: { name: "Joanna Price", email: "joanna@pricewilde.example" },
    account: { company: "Price Wilde Architects", plan: "Growth plan · 8 seats" },
    receivedAt: "2026-10-28T16:30:00Z",
    subject: "Cancelling at the end of our term",
    body: `Hello,

We've decided to move our invoicing into our accounting software, which now does most of what we use Ledgerline for. Please cancel our subscription at the end of the current term (we renew on 30 November) and confirm it won't auto-renew.

Before then I'll need to export all our invoices and client records. Is there anything I should know about the export, for example whether PDFs are included?

Thank you for the service over the last three years.

Joanna Price
Office Manager, Price Wilde Architects`,
    exercises: ["Explicit cancellation, polite tone", "Same export question as the first-screen ticket, with intent stated"],
  },
  {
    id: "LL-5009",
    from: { name: "Ahmed Saleh", email: "ahmed@salehimports.example" },
    account: { company: "Saleh Imports", plan: "Scale plan · 10 seats" },
    receivedAt: "2026-10-28T12:10:00Z",
    subject: "Do we still need the Scale plan?",
    body: `Hi,

Business has slowed down a lot this year and we're down to four people who use Ledgerline. We're on Scale mainly for multi-currency, but we only invoice in euros now, with maybe one or two in dollars a month.

What would we lose if we moved to Growth? And if we change mid-term, do we get anything back?

Ahmed`,
    exercises: ["Billing vs. Cancellation risk (downgrade)"],
  },
  {
    id: "LL-5008",
    from: { name: "Katrin Vogel", email: "katrin.vogel@vogelreisen.example" },
    account: { company: "Vogel Reisen GmbH", plan: "Growth plan · 7 seats" },
    receivedAt: "2026-10-28T08:40:00Z",
    subject: "GDPR deletion request from a former client",
    body: `Dear support team,

A former client has asked us to delete all the personal data we hold about him under Article 17 GDPR. He has invoices with us from 2022 to 2024.

As far as I understand, we must keep invoices for ten years under German tax law, but we should delete everything else: the contact details in his client record, the email history and his portal login. How do we do this in Ledgerline without deleting the invoices themselves?

We have to respond within one month of his request, which arrived on 20 October.

Kind regards,
Katrin Vogel`,
    exercises: ["Reads as a how-to, but touches customer data: never auto-send", "Legal deadline"],
  },
  {
    id: "LL-5007",
    from: { name: "Pieter de Vries", email: "pieter@devriesbouw.example" },
    account: { company: "De Vries Bouwadvies B.V.", plan: "Growth plan · 5 seats" },
    receivedAt: "2026-10-27T15:20:00Z",
    subject: "Our VAT number is missing from your invoice",
    body: `Hello,

The invoice Ledgerline sent us for October (LL-INV-118842) doesn't show our VAT number, so our accountant says we can't apply the reverse charge, and it looks like we've been charged Dutch VAT incorrectly. Our VAT number is in the billing settings.

Can you reissue the invoice with it, and check the previous months too?

Best regards,
Pieter de Vries`,
    exercises: ["\"Invoice\" means Ledgerline's bill to the customer, not the customer's invoices"],
  },
  {
    id: "LL-5006",
    from: { name: "Tasha Williams", email: "tasha@williamscleaning.example" },
    account: { company: "Williams Commercial Cleaning", plan: "Growth plan · 9 seats" },
    receivedAt: "2026-10-27T11:00:00Z",
    subject: "Late fee added to an invoice that was paid on time",
    body: `Hi,

One of our clients, Redwood Medical Centre, paid invoice INV-1187 on 14 October. It was due on the 15th. On the 16th Ledgerline added a “late fee” of $85.00 and sent them a new copy showing a balance due.

Their practice manager called me, and she wasn’t happy. I’ve apologised, but I need to know why it happened and whether it’s happened to anyone else. The payment shows in Ledgerline as received on the 14th.

Can you remove the fee and tell me what went wrong?

Tasha Williams
Williams Commercial Cleaning`,
    exercises: ["Curly apostrophes and quotes"],
  },
  {
    id: "LL-5005",
    from: { name: "Marc Tremblay", email: "marc@tremblaysupply.example" },
    account: { company: "Tremblay Industrial Supply", plan: "Growth plan · 6 seats" },
    receivedAt: "2026-10-27T09:30:00Z",
    subject: "Canadian clients seeing USD on invoices",
    body: `Hi there,

We set our Canadian clients to CAD in their client profiles, but new invoices for them still come out in USD. The ones from before September were fine.

Did a setting change, or am I doing something wrong?

Merci,
Marc`,
    exercises: ["Bug vs. How-to"],
  },
  {
    id: "LL-5004",
    from: { name: "Yuki Tanaka", email: "yuki@tanakatranslation.example" },
    account: { company: "Tanaka Translation Services", plan: "Starter plan · 1 seat" },
    receivedAt: "2026-10-26T21:15:00Z",
    subject: "Loving the new dashboard (one small thing)",
    body: `Hi team,

Just wanted to say the new dashboard is great. Seeing overdue invoices at a glance has saved me a lot of time.

One small thing: could the "Outstanding" total include draft invoices as a separate line? I often have a few drafts waiting on client approval, and it would help to see the full picture.

Thanks for the good work!
Yuki`,
  },
  {
    id: "LL-5003",
    from: { name: "Harriet Lowe", email: "accounts@kingfisherdental.example" },
    account: null,
    receivedAt: "2026-10-26T15:30:00Z",
    subject: "Re: Invoice INV-0932 from Saltmarsh Studio",
    body: `Hello,

We received the invoice below, but our company address has changed. Please could you reissue it to:

Kingfisher Dental Care
18 Mill Lane
Hexham NE46 1AB

Please also add our PO number, 44-1093.

Many thanks,
Harriet Lowe
Accounts Assistant, Kingfisher Dental Care

> Saltmarsh Studio has sent you invoice INV-0932 for £1,250.00, due 14 November 2026.
>
> View and pay online: https://pay.ledgerline.example/i/7Hk2Qm
>
> Sent with Ledgerline`,
    exercises: [
      "Not from a customer: a customer's client replied to an invoice email",
      "No category fits",
      "No account",
    ],
  },
  {
    id: "LL-5002",
    from: { name: "Graham Ellis", email: "g.ellis@ellisrowe.example" },
    account: { company: "Ellis & Rowe Surveyors", plan: "Growth plan · 4 seats" },
    receivedAt: "2026-10-26T07:05:00Z",
    subject: "Automatic reply: [LL-4952] Your request has been resolved",
    body: `Thank you for your email. I am out of the office until Monday 9 November with limited access to email.

For urgent invoicing matters, please contact accounts@ellisrowe.example or call 01632 960 214.

Kind regards,
Graham Ellis`,
    exercises: ["Out-of-office auto-reply: nothing to triage"],
  },
  {
    id: "LL-5001",
    from: { name: "Daniel Cho", email: "daniel@lumenbooking.example" },
    account: { company: "Lumen Booking Systems", plan: "Scale plan · 20 seats" },
    receivedAt: "2026-10-25T18:00:00Z",
    subject: "429 errors when creating invoices in bulk",
    body: `Hi,

We're migrating about 3,000 invoices from our old system through the API. After roughly 100 requests we start getting 429 Too Many Requests, and the rest fail. The docs mention rate limits but don't give numbers.

What's the limit for POST /v1/invoices, and is there a bulk endpoint or a way to raise the limit temporarily for a migration? We were hoping to finish this weekend.

Thanks,
Daniel Cho
Engineering Lead, Lumen Booking Systems`,
    exercises: ["How-to vs. Bug"],
  },
];
