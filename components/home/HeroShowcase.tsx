"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Real, pre-generated exports (design/home/TransferGit Home.dc.html §2) — 4
// cards alternating a player card with the squad card, matching the
// original mockup's own 4-card ring (rotateY(i*90deg) translateZ(...)), so
// the hero never renders anything live. Values are read straight off these
// images, not recomputed. Purely decorative — dragging spins the ring,
// nothing here navigates anywhere.
const CARDS = [
  { user: "@torvalds", val: "€4.80bn", img: "/fan-cards/torvalds.png", alt: "@torvalds's player card" },
  {
    user: "DietrichGebert/ponytail",
    val: "€363.40m",
    img: "/fan-cards/ponytail.png",
    alt: "DietrichGebert/ponytail's squad card",
  },
  { user: "@torvalds", val: "€4.80bn", img: "/fan-cards/torvalds-full.png", alt: "@torvalds's full stats card" },
  {
    user: "DietrichGebert/ponytail",
    val: "€363.40m",
    img: "/fan-cards/ponytail.png",
    alt: "DietrichGebert/ponytail's squad card",
  },
] as const;

// True ring spacing (used for auto-rotation/drag): evenly split 360° across
// however many cards there are (90° apart for 4). Every angle of continuous
// rotation still has at least one card within its own ±90° front-facing arc
// (backface-hidden cards need cos(angle) ≥ 0) as long as the spacing is
// ≤180° — true here since 4×90°=360°. A *snapped* rest position (a slot
// sitting at exactly 0°) has its immediate neighbors sitting at exactly
// ±90°, right at that cutoff — genuinely edge-on/near-invisible there, not
// a bug, same trig that makes "always ≥1 visible while spinning" true in
// the first place. See FAN_ANGLES below for the deliberately different,
// tighter arrangement used only for the static (prefers-reduced-motion)
// presentation, where nothing rotates and showing all 4 at once matters
// more than ring geometry.
const SLOT_ANGLES = CARDS.map((_, i) => (i * 360) / CARDS.length);
// Reduced-motion-only: a fixed fan tight enough that all four stay within
// their own visible arc simultaneously (no backface culling kicking in).
// index 0 stays dead-center (matching the `front` state's default of 0, so
// its highlighted border and the caption always agree on the same card) —
// a symmetric ±N pairing here would give two cards identical cos(angle),
// and the z-index tie is broken by DOM order, which can paint a *different*
// card on top than the one the caption/highlight claims is front.
const FAN_ANGLES = [0, 22, -22, 46];
const CARD_ASPECT = 4 / 5; // width / height
// Pushed further out than a "just touching" ring so there's real empty air
// between cards (matching the mockup) instead of them reading as stacked.
const RADIUS_MARGIN = 1.6;
const STAGE_MULTIPLIER = 2.4; // container width needed relative to card width so flanking cards never clip
const CAPTION_RESERVED_PX = 102; // vertical room left below the ring for the caption + hint
// Target range is ~285-385px on ordinary viewports — but only MAX_CARD_W is
// enforced as a hard clamp; the low end always yields to whatever the
// container actually measures (see recompute() below), so a narrow phone
// shrinks the ring instead of overflowing it.
const MAX_CARD_W = 385;
const REVOLUTION_MS = 40000;
// Negative = counter-clockwise as seen from the camera, i.e. the front card
// drifts screen-left and the next one enters from the right — "always spins
// left", per spec.
const AUTO_ROTATE_DIR = -1;
const DRAG_SENSITIVITY = 0.35; // deg per px
const CLICK_MAX_DRAG_PX = 5; // pointerdown→pointerup movement below this counts as a click, not a drag
const RESUME_DELAY_MS = 3000; // fixed pause after any release (click or drag) before auto-rotate picks back up
const COAST_HALF_LIFE_MS = 250; // inertia decay: velocity halves every this many ms
const COAST_DECAY_PER_MS = Math.pow(0.5, 1 / COAST_HALF_LIFE_MS);
const COAST_STOP_DEG_PER_MS = 0.001; // below this, coasting is imperceptible — just freeze

// pointerdown always freezes the ring in place (mode leaves "auto" the
// instant a finger/pointer touches down, whether or not it ever moves).
// "drag" tracks the pointer 1:1 and its recent velocity; on release, a real
// drag hands that velocity to "coast" (inertia, decaying to a stop), while
// a near-stationary release (a plain click) goes straight to "paused" —
// either way, a single fixed timer brings the ring back to "auto" ~3s later.
type Mode = "auto" | "drag" | "coast" | "paused";

// Depth dimming only — no billboarding, no manual scale. This is a classic
// ring: cards keep their fixed rotateY(slot) + translateZ(radius) transform
// and genuinely turn edge-on as the scene rotates past them (intentional —
// real perspective foreshortening already handles apparent size, so no
// scale() hack is needed on top of it). cos(effectiveAngle) is 1 dead-front
// and -1 dead-back; only the back half (cos < 0) dims, down to ~0.55 at the
// very back.
function depthStyle(effectiveDeg: number): { filter: string; zIndex: number } {
  const cosT = Math.cos((effectiveDeg * Math.PI) / 180);
  const brightness = cosT >= 0 ? 1 : 1 + cosT * 0.45;
  return { filter: `brightness(${brightness})`, zIndex: Math.round(cosT * 1000) };
}

export function HeroShowcase() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [cardW, setCardW] = useState(300);
  const [front, setFront] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sceneAngleRef = useRef(0);
  const modeRef = useRef<Mode>("auto");
  const frontRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const lastTickRef = useRef<number | undefined>(undefined);
  const dragRef = useRef({ startX: 0, startAngle: 0, maxMove: 0, lastX: 0, lastT: 0, velocity: 0 });
  const coastVelocityRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Card size is DERIVED from the actually available box (both width and
  // height, via ResizeObserver — the grid column stretches to the hero's
  // full height in app/page.tsx precisely so this can measure it), never
  // clipped: whatever fits, up to the clamp(260px, ..., 350px) requested,
  // is what renders.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    function recompute() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxByWidth = rect.width / STAGE_MULTIPLIER;
      const budgetH = Math.max(0, rect.height - CAPTION_RESERVED_PX);
      const maxByHeight = budgetH * CARD_ASPECT;
      // MIN_CARD_W is a preferred floor, not a hard one: on a narrow
      // container (small phones) forcing the stage up to that floor would
      // make it wider than the container itself — exactly the horizontal
      // overflow bug this is guarding against. Fit-to-container always
      // wins; MIN_CARD_W only holds back on ordinary/wide viewports.
      setCardW(Math.min(maxByWidth, maxByHeight, MAX_CARD_W));
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function applyAngle(sceneDeg: number) {
    if (sceneRef.current) sceneRef.current.style.transform = `rotateY(${sceneDeg}deg)`;
    let bestIdx = 0;
    let bestCos = -Infinity;
    for (let i = 0; i < CARDS.length; i++) {
      const total = sceneDeg + SLOT_ANGLES[i];
      const cosT = Math.cos((total * Math.PI) / 180);
      if (cosT > bestCos) {
        bestCos = cosT;
        bestIdx = i;
      }
      const el = cardRefs.current[i];
      if (!el) continue;
      const { filter, zIndex } = depthStyle(total);
      el.style.filter = filter;
      el.style.zIndex = String(zIndex);
    }
    if (bestIdx !== frontRef.current) {
      frontRef.current = bestIdx;
      setFront(bestIdx);
    }
  }

  useEffect(() => {
    if (reducedMotion) return;
    const degPerMs = (AUTO_ROTATE_DIR * 360) / REVOLUTION_MS;

    function tick(now: number) {
      const dt = lastTickRef.current ? now - lastTickRef.current : 0;
      lastTickRef.current = now;

      if (modeRef.current === "auto") {
        sceneAngleRef.current += degPerMs * dt;
      } else if (modeRef.current === "coast") {
        sceneAngleRef.current += coastVelocityRef.current * dt;
        coastVelocityRef.current *= Math.pow(COAST_DECAY_PER_MS, dt);
        if (Math.abs(coastVelocityRef.current) < COAST_STOP_DEG_PER_MS) {
          coastVelocityRef.current = 0;
          modeRef.current = "paused";
        }
      }
      // "drag" mode: onPointerMove already writes sceneAngleRef.current
      // directly — this loop just keeps reading and rendering whatever it
      // currently holds. "paused" mode: nothing advances the angle until
      // the resume timer (started on pointerup) flips the mode back to
      // "auto".

      applyAngle(sceneAngleRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  // Purely decorative, no navigation. pointerdown freezes the auto-advance
  // right there, whether or not it turns into a drag (mode leaves "auto"
  // instantly, so the tick loop stops adding to the angle while still
  // rendering it every frame). pointermove drives the angle 1:1 with the
  // pointer and keeps a running velocity estimate. pointerup either hands
  // that velocity to "coast" (a real drag — inertia, decaying to a stop)
  // or goes straight to "paused" (a plain click — no movement, no effect
  // beyond the freeze); either way a single fixed timer flips the mode
  // back to "auto" ~3s later.
  function onPointerDown(e: React.PointerEvent) {
    if (reducedMotion) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    modeRef.current = "drag";
    coastVelocityRef.current = 0;
    dragRef.current = {
      startX: e.clientX,
      startAngle: sceneAngleRef.current,
      maxMove: 0,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (modeRef.current !== "drag") return;
    const d = dragRef.current;
    const now = performance.now();
    d.maxMove = Math.max(d.maxMove, Math.abs(e.clientX - d.startX));
    sceneAngleRef.current = d.startAngle + (e.clientX - d.startX) * DRAG_SENSITIVITY;
    const dt = now - d.lastT;
    if (dt > 0) {
      const dDeg = (e.clientX - d.lastX) * DRAG_SENSITIVITY;
      d.velocity = dDeg / dt;
    }
    d.lastX = e.clientX;
    d.lastT = now;
  }
  function onPointerUp() {
    if (modeRef.current !== "drag") return;
    const wasClick = dragRef.current.maxMove < CLICK_MAX_DRAG_PX;
    modeRef.current = wasClick ? "paused" : "coast";
    coastVelocityRef.current = wasClick ? 0 : dragRef.current.velocity;
    resumeTimerRef.current = setTimeout(() => {
      modeRef.current = "auto";
    }, RESUME_DELAY_MS);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (reducedMotion) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    // A direct nudge, not a tween — consistent with "no eased snapping"
    // elsewhere; auto-rotate just keeps going from the nudged angle.
    sceneAngleRef.current += (e.key === "ArrowRight" ? 1 : -1) * 30;
  }

  const cardH = cardW / CARD_ASPECT;
  const stageW = cardW * STAGE_MULTIPLIER;
  const centerOffsetX = (stageW - cardW) / 2;
  // radius ≈ cardWidth / (2·tan(π/N)), the general regular-N-gon inradius —
  // the distance at which N cards of this width just touch edge-to-edge
  // around the ring — times RADIUS_MARGIN so the flanking cards actually
  // clear the front card's silhouette instead of hiding behind it.
  const radius = (cardW / (2 * Math.tan(Math.PI / CARDS.length))) * RADIUS_MARGIN;

  return (
    <div ref={wrapperRef} className="flex h-full w-full max-w-full items-center justify-center overflow-x-clip">
      {/* Nudged up off dead-center so it reads aligned with the headline
          instead of crowding the ticker below. */}
      <div className="flex -translate-y-4 flex-col items-center lg:-translate-y-10">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onKeyDown={onKeyDown}
          role={reducedMotion ? undefined : "group"}
          aria-label={reducedMotion ? undefined : "Card showcase — drag to spin"}
          tabIndex={reducedMotion ? undefined : 0}
          className={`relative touch-pan-y select-none ${reducedMotion ? "" : "cursor-grab active:cursor-grabbing"}`}
          style={{ width: stageW, height: cardH, perspective: 1300 }}
        >
          {/* transform-style is only "preserve-3d" for the real ring: with
              it active, z-index inside stops being reliable for ordering
              (browsers depth-sort by each child's actual rotateY/translateZ
              position instead) — fine for the ring, since that IS the
              desired depth, but it fights the static fan below, whose
              cards intentionally have no real depth to sort by. "flat"
              makes the reduced-motion fan's z-index behave like normal 2D
              stacking again. */}
          <div ref={sceneRef} className="absolute inset-0" style={{ transformStyle: reducedMotion ? "flat" : "preserve-3d" }}>
            {CARDS.map((card, i) => {
              // Reduced motion: a flat, explicitly-ordered 2D fan (all 4
              // simultaneously visible, nothing moves, index 0 pinned on
              // top). The real ring always uses the true 90°-apart
              // SLOT_ANGLES so continuous rotation never goes fully blank.
              const ring = depthStyle(SLOT_ANGLES[i]);
              const transform = reducedMotion
                ? `translateX(${FAN_ANGLES[i]}%) rotate(${FAN_ANGLES[i] / 3}deg)`
                : `rotateY(${SLOT_ANGLES[i]}deg) translateZ(${radius}px)`;
              const filter = reducedMotion ? "brightness(1)" : ring.filter;
              const zIndexValue = reducedMotion ? CARDS.length - i : ring.zIndex;
              return (
                <div
                  key={`${card.img}-${i}`}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className={`absolute top-0 overflow-hidden rounded-2xl border bg-[var(--tg-surface-elevated)] ${
                    i === front
                      ? "border-[rgba(47,255,0,0.4)] shadow-[0_0_30px_rgba(47,255,0,0.14),0_24px_60px_rgba(0,0,0,0.6)]"
                      : "border-[rgba(47,255,0,0.18)] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                  }`}
                  style={{
                    left: centerOffsetX,
                    width: cardW,
                    height: cardH,
                    backfaceVisibility: "hidden",
                    transform,
                    filter,
                    zIndex: zIndexValue,
                  }}
                >
                  <Image
                    src={card.img}
                    alt={card.alt}
                    fill
                    sizes={`${MAX_CARD_W}px`}
                    draggable={false}
                    priority={i === 0}
                    className="select-none object-cover object-top"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-[68px] flex items-center gap-2.5 font-mono text-sm transition-opacity duration-300">
          <span className="text-[var(--tg-fg-soft)]">{CARDS[front].user}</span>
          <span className="font-bold text-[var(--tg-accent)]">{CARDS[front].val}</span>
        </div>
        {!reducedMotion && (
          <div className="mt-1 font-mono text-[10px] tracking-[0.2em] text-[var(--tg-muted-faint)]">DRAG TO ROTATE</div>
        )}
      </div>
    </div>
  );
}
