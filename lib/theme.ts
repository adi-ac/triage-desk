/**
 * Light, dark, or the OS's. "system" is the default and follows the OS live;
 * picking light or dark overrides it and is kept in localStorage, and picking
 * system clears it. The pick is set as <html data-theme>; with none, the CSS
 * follows prefers-color-scheme. No React here, so the root layout (a server
 * component) can use the script.
 */

export type Theme = "light" | "dark";
export type ThemeChoice = "system" | Theme;

export const themeStorageKey = "theme";

/**
 * Runs in <head> before the first paint, so a stored pick never flashes the
 * OS theme first. Wrapped in try: storage can be blocked.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${themeStorageKey}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;

/** The person's pick, or null while the interface follows the OS. */
export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(themeStorageKey);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}
