/**
 * Ledgerline's help center: short fictional articles the model may draw on.
 * A draft may state only facts found in the customer's email or in these
 * articles; anything else is a [placeholder] (docs/brief.md). Ledgerline,
 * its plans, menus and limits are invented for the demo.
 */

export type HelpArticle = {
  /** Cited as the evidence's article title, so it must stay unique. */
  title: string;
  body: string;
};

export const helpArticles: readonly HelpArticle[] = [
  {
    title: "Exporting your data",
    body: `You can export your invoices, clients and payments at any time, on every plan, from Settings → Data → Export. Choose what to include and a date range; the default is everything since your account was created. Each type downloads as its own CSV file. Tick "Include invoice PDFs" to add a PDF of every invoice in a zip file. File attachments on invoices are not included in exports; download them from each invoice. Exports of more than 5,000 invoices are prepared in the background and emailed to you as a download link within 24 hours.`,
  },
  {
    title: "Using the Ledgerline API",
    body: `The API is available on the Growth and Scale plans. An account owner creates API keys in Settings → Developers. The API can read your full history of invoices, clients and payments, with no date limit. Each invoice's PDF is available from the invoice's pdf endpoint. Requests are limited to 120 per minute per key. The API reference is at developers.ledgerline.example.`,
  },
  {
    title: "Invoices and billing",
    body: `Ledgerline bills your subscription monthly or yearly on your renewal date. Invoices from Ledgerline to you are numbered LB- followed by digits and are listed in Settings → Billing → Invoices. Invoices you create for your own clients use your own numbering, set in Settings → Invoice numbering. The total on an invoice you create is calculated from its line items, discounts and the tax rates set in Settings → Tax. To add your logo to the invoices you send, upload it in Settings → Branding → Invoice logo. If a charge from Ledgerline looks wrong, reply with the LB- invoice number and we'll check it within one business day.`,
  },
  {
    title: "Changing your plan",
    body: `Ledgerline has three plans: Starter, Growth and Scale. An account owner can change plans in Settings → Billing → Plan. Upgrades take effect immediately and are charged pro rata for the rest of the billing period. Downgrades take effect on your next renewal date. Adding seats is charged pro rata; removing seats takes effect on your next renewal date.`,
  },
  {
    title: "Cancelling or not renewing",
    body: `An account owner can turn off renewal at any time before the renewal date in Settings → Billing → Plan. You keep full access until the end of the period you've paid for. After that, your account stays available read-only for 90 days, so you can still export your data; then it's deleted. If you're reviewing your tools before a renewal, your account manager can walk you through your options.`,
  },
  {
    title: "Passwords and access",
    body: `Anyone can reset their own password from the "Forgot password" link on the sign-in page; the reset link expires after one hour. Account owners and admins can resend invitations and remove teammates in Settings → Team. Two-factor authentication can be required for the whole team in Settings → Security. Single sign-on is available on the Scale plan.`,
  },
];

export const helpArticleTitles = helpArticles.map((a) => a.title) as [string, ...string[]];
