"use client";

export const SCOUT_SQUAD_EVENT = "tg:scout-squad";

// Scrolls to the hero (native smooth scroll — see OmniSearch.tsx for why
// this isn't Lenis: nothing in the codebase actually initializes a Lenis
// instance today, despite the dependency being installed) and tells
// OmniSearch to focus itself and switch to the squad hint/placeholder for a
// moment, via a plain DOM CustomEvent — the two components don't otherwise
// share any state.
export function ScoutCta() {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });

    if (reduced) {
      window.dispatchEvent(new CustomEvent(SCOUT_SQUAD_EVENT));
      return;
    }

    // Focusing the omnibox while the smooth scroll is still animating makes
    // the browser's own focus-scroll fight the in-progress one, cutting it
    // short partway down the page — wait for the scroll to actually settle
    // (scrollend, with a timeout fallback for browsers without it) before
    // firing the event that focuses the input.
    let fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      window.removeEventListener("scrollend", fire);
      window.dispatchEvent(new CustomEvent(SCOUT_SQUAD_EVENT));
    }
    window.addEventListener("scrollend", fire, { once: true });
    setTimeout(fire, 900);
  }

  return (
    <a
      href="#scout"
      onClick={handleClick}
      className="rounded-lg border border-[var(--tg-accent)] px-6 py-2.5 text-center font-oswald text-sm font-semibold uppercase tracking-wide text-[var(--tg-accent)] transition hover:bg-[var(--tg-accent)] hover:text-[#04120a] hover:shadow-[0_0_24px_rgba(47,255,0,0.4)]"
    >
      Scout your repo →
    </a>
  );
}
