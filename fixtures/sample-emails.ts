/**
 * Sample emails for the New ticket form: its placeholders show one, and
 * "Use a sample email" fills it in (DESIGN.md, NewTicketForm). Fictional,
 * like every ticket here. Inputs only: the AI's answer comes from the live
 * route when one is added.
 */

export type SampleEmail = { name: string; company: string; subject: string; message: string };

export const sampleEmails: readonly SampleEmail[] = [
  {
    name: "Priya Raghavan",
    company: "Tidepool Swim School",
    subject: "Can I change the currency on an invoice I already sent?",
    message:
      "Hi,\n\nI sent a term invoice to one of our families in GBP by mistake. They live in Ireland and pay in euros. Can I change the currency on the invoice they already have, or do I need to cancel it and send a new one?\n\nThe due date is next Friday, so I'd like to sort it before then.\n\nThanks,\nPriya",
  },
  {
    name: "Tomás Ortega",
    company: "Ortega Roofing",
    subject: "Bank feed stopped updating on Tuesday",
    message:
      "Hello,\n\nOur bank feed hasn't pulled in any transactions since Tuesday morning. Payments are landing in the account, but nothing shows up in Ledgerline, so invoices that have been paid still show as open.\n\nWe haven't changed anything on our side. Is there a problem with the connection?\n\nTomás Ortega\nOrtega Roofing",
  },
  {
    name: "Imogen Clarke",
    company: "Copperleaf Bakery",
    subject: "Adding a second trading address to invoices",
    message:
      "Hi there,\n\nWe've opened a second shop and some customers order from there. Is it possible to have a different address on invoices depending on which shop the order came from? At the moment I can only see one business address in settings.\n\nMany thanks,\nImogen",
  },
  {
    name: "Marcus Lind",
    company: "Northgate Cabinetry",
    subject: "One client says our invoice emails bounce",
    message:
      "Hi,\n\nOne of our bigger clients says they haven't received our last three invoices. Their accounts team says the emails are bouncing, but we don't get any bounce message on our side.\n\nCould you check what's happening with emails to their domain? I can send you the invoice numbers.\n\nMarcus",
  },
  {
    name: "Aiko Mori",
    company: "Blue Heron Yoga",
    subject: "Can invoices go out on a set date?",
    message:
      "Hello,\n\nI prepare my monthly invoices at the end of the month, but I'd like them to arrive in students' inboxes on the 1st. Is there a way to write them now and schedule them to send on a specific date?\n\nThank you!\nAiko",
  },
  {
    name: "Kwame Asante",
    company: "Asante & Partners Architects",
    subject: "Charged after cancelling our trial",
    message:
      "Hi,\n\nWe cancelled our trial on the 3rd, a few days before it ended, but our card was charged for the Growth plan yesterday. I have the cancellation confirmation email if you need it.\n\nPlease refund the charge and confirm the account is closed.\n\nKwame Asante\nOperations, Asante & Partners",
  },
  {
    name: "Leonie Fischer",
    company: "Fischer Haustechnik GmbH",
    subject: "Limit who can see payment reports?",
    message:
      "Hi,\n\nWe've added two apprentices to our account so they can create quotes. I don't want them to see our payment reports or bank details. Is there a role that lets them make quotes and invoices without access to the financial reports?\n\nBest regards,\nLeonie Fischer",
  },
  {
    name: "Diego Navarro",
    company: "Navarro Catering Co.",
    subject: "Deposit invoices for events months away",
    message:
      "Hey team,\n\nWe book weddings up to a year ahead and take a 30% deposit at booking, then the rest a month before the event. What's the best way to set this up so the second invoice goes out automatically?\n\nRight now I'm doing it by hand and I've missed a couple.\n\nDiego",
  },
  {
    name: "Rafael Mendes",
    company: "Mendes Coffee Roasters",
    subject: "Re: Recurring invoices question",
    message:
      "Hi,\n\nJust wanted to say thanks, the steps you sent worked and the recurring invoices went out this morning.\n\nNo need to reply!\n\nCheers,\nRafael",
  },
];

/** A random sample's index, never `last` (the one picked before). */
export function pickSample(last: number | null): number {
  if (sampleEmails.length < 2) return 0;
  let i = Math.floor(Math.random() * (sampleEmails.length - (last === null ? 0 : 1)));
  if (last !== null && i >= last) i += 1;
  return i;
}
