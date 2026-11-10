/**
 * iOS and iPadOS Safari only apply :active (Button's press state) while a
 * touchstart listener exists somewhere on the page. One empty, passive
 * listener on the document is enough, and it costs nothing elsewhere:
 * passive, so it never delays scrolling. No React here, so the root layout
 * (a server component) runs it in <head>.
 */
export const pressScript = `document.addEventListener("touchstart",function(){},{passive:true})`;
