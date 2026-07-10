"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "market-value", label: "Market Value" },
  { id: "trophies", label: "Trophies" },
  { id: "stats", label: "Stats" },
];

export function ProfileTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sections = TABS.map((tab) => document.getElementById(tab.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeTab = tabRefs.current[active];
    const indicator = indicatorRef.current;
    if (!activeTab || !indicator) return;

    activeTab.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });

    const { offsetLeft, offsetWidth } = activeTab;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(indicator, { x: offsetLeft, width: offsetWidth });
      return;
    }
    gsap.to(indicator, { x: offsetLeft, width: offsetWidth, duration: 0.35, ease: "power2.out" });
  }, [active]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActive(id);
  }

  return (
    <div className="sticky top-[57px] z-30 border-b border-border bg-pitch/95 backdrop-blur-md">
      <nav ref={navRef} className="relative mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            href={`#${tab.id}`}
            onClick={(e) => handleClick(e, tab.id)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-3 font-table text-sm font-semibold uppercase tracking-wide transition-colors ${
              active === tab.id ? "text-tm-blue-bright" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </a>
        ))}
        <span
          ref={indicatorRef}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-tm-blue-bright"
        />
      </nav>
    </div>
  );
}
