/**
 * Light and dark. The interface follows the OS until a person picks one in
 * ThemeToggle; the pick is kept in localStorage and set as <html data-theme>.
 * No React here, so the root layout (a server component) can use the script.
 */

export type Theme = "light" | "dark";

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
