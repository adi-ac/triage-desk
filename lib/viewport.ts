/**
 * iOS and iPadOS only: adds maximum-scale=1 to the viewport meta tag, so
 * Safari doesn't zoom the page when a field with text under 16px is tapped
 * (NewTicketForm's fields and the draft reply are 14px). Since iOS 10
 * Safari ignores maximum-scale for pinch-zoom, so people can still zoom
 * freely. Never on other platforms: on Android it would block pinch-zoom
 * (DESIGN.md, Tokens, Text fields). iPads asking for desktop sites report
 * as a Mac, so a Mac with touch counts too.
 *
 * It patches the tag before the first paint, and keeps watching <head>:
 * React re-renders Next's viewport tag when it hydrates (and adds it again
 * if it finds it changed), so every viewport tag that appears later is
 * patched too. No React here, so the root layout (a server component) runs
 * it in <head>.
 */
export const viewportScript = `(function(){var n=navigator,u=n.userAgent;if(!(/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&n.maxTouchPoints>1)))return;function p(){document.querySelectorAll('meta[name="viewport"]').forEach(function(m){if(!/maximum-scale/.test(m.content))m.content+=", maximum-scale=1"})}p();new MutationObserver(p).observe(document.head,{childList:true})})()`;
