/**
 * Live contrast checks for /system. Each color is resolved from the page's
 * own CSS (so oklch, color-mix and theme switches all apply), painted onto a
 * 1×1 canvas over its background, and read back as sRGB.
 */

type RGB = [number, number, number];

export type Pair = {
  label: string;
  fg: string;
  bg: string;
  /** Text needs 4.5:1 and Lc 60; non-text (borders, rings, meters) needs 3:1. */
  kind: "text" | "non-text";
};

export type Result = Pair & { wcag: number; apca: number; pass: boolean };

let ctx: CanvasRenderingContext2D | null = null;

function paint(colors: string[]): RGB {
  if (!ctx) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  }
  ctx.clearRect(0, 0, 1, 1);
  for (const c of colors) {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** The computed color of a custom property, e.g. "--ink". */
function computed(token: string, host: HTMLElement) {
  host.style.color = `var(${token})`;
  return getComputedStyle(host).color;
}

function luminance([r, g, b]: RGB) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function wcag(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** APCA-W3 0.0.98G. Returns Lc, negative for light text on dark. */
function apca(text: RGB, bg: RGB) {
  const y = ([r, g, b]: RGB) => {
    const v = 0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;
    return v < 0.022 ? v + (0.022 - v) ** 1.414 : v;
  };
  const yt = y(text);
  const yb = y(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

/** Background tokens may be translucent or transparent; they sit on --surface. */
export function check(pairs: Pair[]): Result[] {
  const host = document.createElement("span");
  host.style.display = "none";
  document.body.append(host);
  const surface = computed("--surface", host);
  const results = pairs.map((p) => {
    const bgColor = computed(p.bg, host);
    const bg = paint([surface, bgColor]);
    const fg = paint([surface, bgColor, computed(p.fg, host)]);
    const ratio = wcag(fg, bg);
    const lc = apca(fg, bg);
    const pass = p.kind === "text" ? ratio >= 4.5 && Math.abs(lc) >= 60 : ratio >= 3;
    return { ...p, wcag: ratio, apca: lc, pass };
  });
  host.remove();
  return results;
}
