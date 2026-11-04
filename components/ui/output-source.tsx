import type { ComponentProps } from "react";
import { Banner } from "./banner";

/**
 * Where a screen's model output came from. Every screen that shows model
 * output carries exactly one. hand-written is for the build only: it must be
 * replaced by recorded output before shipping, so it's a warning.
 */
export type OutputSourceKind = "recorded" | "live" | "hand-written";

const copy: Record<OutputSourceKind, { tone: "info" | "warning"; title: string; body: string }> = {
  recorded: {
    tone: "info",
    title: "Recorded example",
    body: "These suggestions were recorded from the model, not generated live.",
  },
  live: {
    tone: "info",
    title: "Live output",
    body: "These suggestions came from the model just now.",
  },
  "hand-written": {
    tone: "warning",
    title: "Hand-written example",
    body: "Written by hand while this screen is built. Not model output; it must be replaced by a recorded run before shipping.",
  },
};

export type OutputSourceProps = Omit<ComponentProps<"div">, "className" | "style" | "children" | "title"> & {
  source: OutputSourceKind;
};

/** The label for model output. Fixed wording, so no screen can soften it. */
export function OutputSource({ source, ...props }: OutputSourceProps) {
  const { tone, title, body } = copy[source];
  return (
    <Banner {...props} tone={tone} title={title}>
      {body}
    </Banner>
  );
}
