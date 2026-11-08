"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "./button";
import styles from "./new-ticket-form.module.css";

export type NewTicketFormProps = {
  /**
   * Where it sits. dialog: the desktop Dialog, 20px side padding, the
   * fields at their own height. panel: HeaderPanel's New ticket view, 16px
   * padding, filling the panel: Message grows to fill the height, the
   * footer sits at the bottom, and the fields and footer scroll together
   * (with extra room while the iOS keyboard is open).
   */
  variant: "dialog" | "panel";
};

type Values = { name: string; company: string; subject: string; message: string };

const empty: Values = { name: "", company: "", subject: "", message: "" };

/** Fictional, like every ticket here: an SSO outage. */
const sample: Values = {
  name: "Dana Okafor",
  company: "Tidewater Co-op",
  subject: "Nobody can log in after our SSO switch",
  message: `Hi,

We moved our single sign-on to a new provider this morning, and since then nobody on our team can log in to Ledgerline. After signing in with the provider, everyone lands back on the Ledgerline sign-in page, with no error.

Our month-end invoices go out on Friday, so we need this working again soon. Could you take a look?

Thanks,
Dana Okafor
Operations lead, Tidewater Co-op`,
};

/**
 * A new ticket: the customer, the subject and the email (DESIGN.md,
 * NewTicketForm). Opened from the queue's New ticket button: in a Dialog
 * from 1200px, in the queue panel's New ticket view below. It holds its own
 * text; the container clears it by remounting it (a new key) when it closes.
 */
export function NewTicketForm({ variant }: NewTicketFormProps) {
  const id = useId();
  const [values, setValues] = useState(empty);
  // Checked on every input: both required fields need non-blank text.
  const ready = values.name.trim() !== "" && values.message.trim() !== "";
  const bind = (key: keyof Values) => ({
    id: `${id}-${key}`,
    name: key,
    value: values[key],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <form
      className={styles.form}
      data-variant={variant}
      // Enter in a text field submits (the browser's implicit submission,
      // which a disabled submit button blocks).
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        // TODO: add the ticket and triage it with the live model. Needs the
        // per-visitor limit and the daily spend cap first (docs/brief.md).
      }}
    >
      <div className={styles.column}>
        <div className={styles.fields}>
          <div className={styles.pair}>
            <Field id={`${id}-name`} label="Customer name" required>
              <input
                {...bind("name")}
                className={styles.input}
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Dana Okafor"
                data-autofocus
              />
            </Field>
            <Field id={`${id}-company`} label="Company">
              <input
                {...bind("company")}
                className={styles.input}
                type="text"
                autoComplete="organization"
                placeholder="e.g. Tidewater Co-op"
              />
            </Field>
          </div>
          <Field id={`${id}-subject`} label="Subject">
            <input
              {...bind("subject")}
              className={styles.input}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. Can't log in after our SSO switch"
            />
          </Field>
          <Field id={`${id}-message`} label="Message" required grow>
            <textarea
              {...bind("message")}
              className={`${styles.input} ${styles.message}`}
              required
              rows={variant === "dialog" ? 7 : 5}
              placeholder="Paste the email here"
              onKeyDown={(e) => {
                // Cmd+Enter (Ctrl+Enter off the Mac) submits from the message.
                if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return;
                e.preventDefault();
                if (ready) e.currentTarget.form?.requestSubmit();
              }}
            />
          </Field>
        </div>
        <div className={styles.footer}>
          <Button onClick={() => setValues(sample)}>Use a sample email</Button>
          <Button type="submit" variant="primary" disabled={!ready}>
            Add and triage
          </Button>
        </div>
      </div>
      {/* Scroll room under the footer while the iOS keyboard covers the panel (panel only). */}
      {variant === "panel" && <div className={styles.keyboardSpace} aria-hidden />}
    </form>
  );
}

function Field({
  id,
  label,
  required = false,
  grow = false,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  /** Message in the panel: fills the height the other fields leave. */
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.field} data-grow={grow ? "" : undefined}>
      <label htmlFor={id} className={`text-small ${styles.label}`}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
