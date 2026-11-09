"use client";

import { useId, useRef, useState, type ReactNode, type TouchEvent } from "react";
import type { SampleEmail } from "@/fixtures/sample-emails";
import { TRIAGE_LIMITS } from "@/lib/triage-request";
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
  /**
   * The sample email picked when the form opened: the Customer name,
   * Company and Subject placeholders show it, and "Use a sample email"
   * fills it in.
   */
  sample: SampleEmail;
  /**
   * "Use a sample email" when Customer name already has text: the container
   * picks the next sample (never the same twice in a row) and returns it;
   * the placeholders follow it, and it's what fills in.
   */
  onNextSample: () => SampleEmail;
  /** Add and triage, with every field trimmed; blank optional fields are left out. */
  onAdd: (ticket: { name: string; company?: string; subject?: string; message: string }) => void;
};

type Values = { name: string; company: string; subject: string; message: string };

const empty: Values = { name: "", company: "", subject: "", message: "" };

const names: Record<keyof Values, string> = {
  name: "Customer name",
  company: "Company",
  subject: "Subject",
  message: "Message",
};

/**
 * A new ticket: the customer, the subject and the email (DESIGN.md,
 * NewTicketForm). Opened from the queue's New ticket button: in a Dialog
 * from 1200px, in the queue panel's New ticket view below. It holds its own
 * text; the container clears it by remounting it (a new key) when it closes,
 * and picks the sample email its placeholders show.
 */
export function NewTicketForm({ variant, sample, onNextSample, onAdd }: NewTicketFormProps) {
  const id = useId();
  const [values, setValues] = useState(empty);
  // Where the current touch started, so a drag (scrolling the form) isn't a tap.
  const touch = useRef<{ x: number; y: number } | null>(null);
  // Longer than the live route takes (TRIAGE_LIMITS): said under the field, never cut short.
  const tooLong = (key: keyof Values) => {
    const length = values[key].trim().length;
    return length > TRIAGE_LIMITS[key]
      ? `${names[key]} is ${length.toLocaleString("en")} characters. The limit is ${TRIAGE_LIMITS[key].toLocaleString("en")}.`
      : undefined;
  };
  const errors = {
    name: tooLong("name"),
    company: tooLong("company"),
    subject: tooLong("subject"),
    message: tooLong("message"),
  };
  // Checked on every input: both required fields need non-blank text, and nothing is too long.
  const ready = values.name.trim() !== "" && values.message.trim() !== "" && !Object.values(errors).some(Boolean);
  const bind = (key: keyof Values) => ({
    id: `${id}-${key}`,
    name: key,
    value: values[key],
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-error` : undefined,
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });
  const fillSample = () => setValues({ ...(values.name.trim() ? onNextSample() : sample) });

  return (
    <form
      className={styles.form}
      data-variant={variant}
      // The panel (iOS): a tap on a field that doesn't have focus yet
      // focuses it without the browser's own scroll, which pans the whole
      // page to reveal the field and fights HeaderPanel's page lock (the
      // page dropped and slid back on every field change). HeaderPanel
      // brings the field into view inside the panel instead, smoothly and
      // only when it's hidden. The keyboard still opens, since the focus
      // happens inside the tap. Once a field has focus, taps in it are left
      // alone, so the caret can still be placed. The Dialog is unchanged.
      onTouchStart={variant === "panel" ? (e) => (touch.current = point(e)) : undefined}
      onTouchEnd={variant === "panel" ? (e) => focusWithoutScroll(e, touch.current) : undefined}
      // Enter in a text field submits (the browser's implicit submission,
      // which a disabled submit button blocks).
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        const optional = (v: string) => v.trim() || undefined;
        onAdd({
          name: values.name.trim(),
          company: optional(values.company),
          subject: optional(values.subject),
          message: values.message.trim(),
        });
      }}
    >
      <div className={styles.column}>
        <div className={styles.fields}>
          <div className={styles.pair}>
            <Field id={`${id}-name`} label="Customer name" required error={errors.name}>
              <input
                {...bind("name")}
                className={styles.input}
                type="text"
                required
                autoComplete="name"
                placeholder={`e.g. ${sample.name}`}
                data-autofocus
              />
            </Field>
            <Field id={`${id}-company`} label="Company" error={errors.company}>
              <input
                {...bind("company")}
                className={styles.input}
                type="text"
                autoComplete="organization"
                placeholder={`e.g. ${sample.company}`}
              />
            </Field>
          </div>
          <Field id={`${id}-subject`} label="Subject" error={errors.subject}>
            <input
              {...bind("subject")}
              className={styles.input}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder={`e.g. ${sample.subject}`}
            />
          </Field>
          <Field id={`${id}-message`} label="Message" required grow error={errors.message}>
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
          <Button onClick={fillSample}>Use a sample email</Button>
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

function point(e: TouchEvent) {
  const t = e.changedTouches[0];
  return t ? { x: t.clientX, y: t.clientY } : null;
}

/** The field a tap landed on (its label counts), if it doesn't have focus yet. */
function tappedField(target: EventTarget) {
  if (!(target instanceof Element)) return null;
  const label = target.closest("label");
  const field = label?.control ?? target.closest("input, textarea");
  return field instanceof HTMLElement && field !== document.activeElement ? field : null;
}

/** On a tap (not a drag), focuses the field without the browser scrolling the page to it. */
function focusWithoutScroll(e: TouchEvent, start: { x: number; y: number } | null) {
  const end = point(e);
  if (!start || !end || Math.hypot(end.x - start.x, end.y - start.y) > 10) return;
  const field = tappedField(e.target);
  if (!field) return;
  e.preventDefault();
  field.focus({ preventScroll: true });
}

function Field({
  id,
  label,
  required = false,
  grow = false,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  /** Message in the panel: fills the height the other fields leave. */
  grow?: boolean;
  /** What's wrong with it, under the field. */
  error?: string;
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
      {error && (
        <p id={`${id}-error`} className={`text-small ${styles.error}`}>
          {error}
        </p>
      )}
    </div>
  );
}
