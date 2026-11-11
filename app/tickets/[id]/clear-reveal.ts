import { together, type RevealContext, type RevealSpec } from "skullet";

/**
 * The reveal for an added ticket's Triage pane (DESIGN.md, Loading and
 * errors). Its skeleton is always triage-shaped, measured from a typical
 * suggestion. A triage answer matches it, so it crossfades as Skullet's
 * built-in `together` does, unchanged. A short answer ("not a request", or
 * a failure), marked `data-reveal="clear"`, would fade in over bars that
 * don't line up, so it clears, then shows: the skeleton fades out first,
 * and the content only starts once it has gone; nothing overlaps.
 *
 * Built on Skullet's exported `RevealSpec`, nothing patched: `choose` picks
 * per reveal, and "clear, then show" is a wipe whose two masks are uniform
 * alpha, worked out each frame from the motion tokens (the skeleton's fade
 * and the content's delayed fade, each with its own easing). Skullet keeps
 * its own height change (280ms) and its reduced motion (everything at once).
 *
 * Skullet only runs a wipe over at most 1.5 screens (the skeleton and
 * content together), and turns a bigger one into a crossfade. A phone
 * shorter than about 716px is over that, so there the short answer swaps
 * in at once instead (duration 0): still nothing overlapping.
 */

/** Skullet's limit on a wipe's area, in screens; from its README ("about a screen and a half"). */
const WIPE_LIMIT = 1.5;

/** A CSS easing keyword or cubic-bezier() as a function of progress, 0 to 1. */
function easing(value: string): (x: number) => number {
  const named: Record<string, [number, number, number, number]> = {
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  };
  if (value === "linear") return (x) => x;
  const bezier = /cubic-bezier\(([^)]+)\)/.exec(value);
  const [x1, y1, x2, y2] = bezier ? (bezier[1].split(",").map(Number) as [number, number, number, number]) : (named[value] ?? named.ease);
  const curve = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Find t where the curve's x is x (bisection: monotonic in x), then return its y.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (curve(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return curve(y1, y2, (lo + hi) / 2);
  };
}

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const ms = (name: string) => {
  const value = token(name);
  return value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
};
/** A mask that shows everything at one opacity. */
const alpha = (a: number) => `linear-gradient(rgb(0 0 0 / ${a.toFixed(3)}), rgb(0 0 0 / ${a.toFixed(3)}))`;

/** The skeleton out, then the content in, as a wipe over `total` ms. */
function clearThenShow(): RevealSpec {
  const outFor = ms("--duration-reveal-clear");
  const outEase = easing(token("--ease-reveal-clear"));
  const inAfter = ms("--delay-reveal-show");
  const inFor = ms("--duration-reveal-show");
  const inEase = easing(token("--ease-reveal-show"));
  const total = Math.max(outFor, inAfter + inFor);
  return {
    order: "together",
    duration: total,
    wipe: {
      // The content: hidden until the skeleton has gone, then fading in.
      mask: (progress: number) => alpha(inEase((progress * total - inAfter) / inFor)),
      // The skeleton: fading out from the start.
      out: (progress: number) => alpha(1 - outEase((progress * total) / outFor)),
    },
  };
}

/** Whether Skullet would run a wipe here: the reveal and everything in it (the outgoing skeleton too) within its limit. */
function wipeFits(reveal: HTMLElement) {
  let { left, top, right, bottom } = reveal.getBoundingClientRect();
  for (const child of reveal.children) {
    const r = child.getBoundingClientRect();
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return (right - left) * (bottom - top) <= innerWidth * innerHeight * WIPE_LIMIT;
}

export const liveTriageReveal: RevealSpec = {
  ...together,
  choose: ({ content, reveal }: RevealContext): RevealSpec => {
    if (!content.querySelector('[data-reveal="clear"]')) return together;
    // Under reduced motion Skullet swaps at once, as it does for `together`.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return together;
    return wipeFits(reveal) ? clearThenShow() : { duration: 0 };
  },
};
