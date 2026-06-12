"use client";

import { useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

/* Gradient-mask slash reveal: stacked fullscreen images, pinned section.
   Each transition plays in two mirrored phases driven by scroll:
     phase 1 — black floods in from the outer corners, squeezing the current
               photo into a thin diagonal slash at the center, until black;
     phase 2 — as in the reference: pinched in the middle, the slash pushes
               toward the edges, blooming the next photo from the inside out.
   Titles wipe in/out in sync and animate word by word, with a step counter.
   All scroll-scrubbed, fully reversible. */

const SLIDES = [
  {
    src: "/colors/vespa_verde.webp",
    title: "Verde Salvia",
    caption: "Soft sage, at home on every stone piazza.",
  },
  {
    src: "/colors/vespa_rosso.webp",
    title: "Rosso Terracotta",
    caption: "Sun-baked red, born among Tuscan farmhouses.",
  },
  {
    src: "/colors/vespa_bianco.webp",
    title: "Bianco Alpino",
    caption: "Cream white, crisp as a mountain lake morning.",
  },
  {
    src: "/colors/vespa_celeste.webp",
    title: "Celeste Adriatico",
    caption: "Harbor blue, made for golden-hour rides along the coast.",
  },
];

const TRANSITIONS = SLIDES.length - 1;
const SEG = 1 / TRANSITIONS;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const fmtStep = (i: number) => String(i + 1).padStart(2, "0");

function applyMask(el: HTMLElement, mask: string) {
  el.style.maskImage = mask;
  (el.style as CSSStyleDeclaration & { webkitMaskImage: string }).webkitMaskImage = mask;
}

/** slash angle: a steep diagonal "/" band, rotating slightly as it opens */
const slashAngle = (p: number) => 68 + p * 24;

/* hard slash edge: 0.4% transition is just enough to anti-alias the
   diagonal line without reading as a fade */
const FEATHER = 0.4;

/** visible slash band expanding from the center: black = visible, transparent = hidden */
function revealMask(p: number, feather = FEATHER) {
  const half = p * 64;
  const left = 50 - half;
  const right = 50 + half;
  return `linear-gradient(${slashAngle(p)}deg, transparent ${left - feather}%, black ${left}%, black ${right}%, transparent ${right + feather}%)`;
}

/** inverse: hidden slash band expanding from the center (used to wipe the old title out) */
function hideMask(p: number, feather = FEATHER) {
  const half = p * 64;
  const left = 50 - half;
  const right = 50 + half;
  return `linear-gradient(${slashAngle(p)}deg, black ${left - feather}%, transparent ${left}%, transparent ${right}%, black ${right + feather}%)`;
}

export default function VespaColorReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRefs = useRef<HTMLSpanElement[][]>(SLIDES.map(() => []));
  const stepRef = useRef<HTMLSpanElement>(null);
  const shownStepRef = useRef(-1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 38,
    restDelta: 0.0005,
  });

  const setStep = useCallback((index: number) => {
    if (index === shownStepRef.current) return;
    shownStepRef.current = index;
    if (stepRef.current) stepRef.current.textContent = fmtStep(index);
  }, []);

  const update = useCallback(
    (v: number) => {
      /* each transition owns an equal slice of the scroll range:
         phase 1 (p1) — the current photo's visible band shrinks from full
                        screen down to a pinched center slash (black closes in
                        from the outside);
         phase 2 (p2) — the black's hidden band grows from that same pinched
                        center outward, blooming the next photo */
      for (let t = 0; t < TRANSITIONS; t++) {
        const p = clamp((v - t * SEG) / SEG, 0, 1);
        const p1 = clamp(p * 2, 0, 1);
        const p2 = clamp(p * 2 - 1, 0, 1);

        const img = imgRefs.current[t];
        if (img) {
          if (p1 >= 1) {
            img.style.opacity = "0";
          } else {
            img.style.opacity = "1";
            applyMask(img, p1 <= 0.001 ? "none" : revealMask(1 - p1));
          }
        }

        const black = blackRefs.current[t];
        if (black) applyMask(black, p2 <= 0.001 ? "none" : hideMask(p2));
      }

      /* which transition segment are we inside? */
      const s = clamp(Math.floor(v / SEG), 0, TRANSITIONS - 1);
      const local = clamp((v - s * SEG) / SEG, 0, 1);
      const p1 = clamp(local * 2, 0, 1);
      const p2 = clamp(local * 2 - 1, 0, 1);

      /* counter flips at full black, just before the new photo opens */
      setStep(local > 0.5 ? s + 1 : s);

      /* title masks + word-by-word motion */
      SLIDES.forEach((_, k) => {
        const titleEl = titleRefs.current[k];
        const words = wordRefs.current[k];
        if (!titleEl) return;

        /* current title is squeezed into the center slash with its photo;
           next title blooms from that same center slash outward */
        let mask = "";
        if (k === s) mask = p1 <= 0.001 ? "none" : revealMask(1 - p1);
        else if (k === s + 1) mask = revealMask(p2);
        titleEl.style.visibility = k === s || k === s + 1 ? "visible" : "hidden";
        if (mask) applyMask(titleEl, mask);

        words.forEach((w, wi) => {
          let opacity = 0;
          let y = 26;
          let rot = 6;
          if (k === s) {
            // current title dissolves out while the black slash closes in
            const wp = clamp((local - wi * 0.03) / 0.38, 0, 1);
            opacity = 1 - wp;
            y = -22 * wp;
            rot = -5 * wp;
          } else if (k === s + 1) {
            // next title assembles itself as the slash opens onto the photo
            const wp = clamp((local - 0.55 - wi * 0.05) / 0.4, 0, 1);
            opacity = wp;
            y = 26 * (1 - wp);
            rot = 6 * (1 - wp);
          }
          w.style.opacity = String(opacity);
          w.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
        });
      });
    },
    [setStep]
  );

  useMotionValueEvent(progress, "change", update);

  /* paint the initial state (slide 0 visible, title 0 assembled, counter 01) */
  useEffect(() => {
    update(0);
  }, [update]);

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `${(TRANSITIONS + 1) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* image stack */}
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={{ zIndex: (SLIDES.length - i) * 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={`Vespa Primavera — ${slide.title}`}
              className="h-full w-full object-cover"
              loading="eager"
              draggable={false}
            />
            {/* scrim for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
          </div>
        ))}

        {/* black slash interstitials — one per transition, sandwiched between
            the outgoing photo (above) and the incoming photo (below) */}
        {Array.from({ length: TRANSITIONS }, (_, t) => (
          <div
            key={`slash-${t}`}
            ref={(el) => {
              blackRefs.current[t] = el;
            }}
            className="absolute inset-0 bg-black"
            style={{ zIndex: (SLIDES.length - t) * 2 - 1 }}
          />
        ))}

        {/* section eyebrow */}
        <div className="absolute left-6 top-20 z-20 sm:left-12 lg:left-24">
          <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/60">
            The Collection
          </span>
        </div>

        {/* titles — stacked, masked, word-animated */}
        <div className="absolute inset-x-6 bottom-24 z-20 sm:inset-x-12 lg:inset-x-24">
          {SLIDES.map((slide, k) => (
            <div
              key={slide.title}
              ref={(el) => {
                titleRefs.current[k] = el;
              }}
              className="absolute bottom-0 left-0"
              style={{ visibility: k === 0 ? "visible" : "hidden" }}
            >
              <h3 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white/90 sm:text-7xl lg:text-8xl">
                {slide.title.split(" ").map((word, wi) => (
                  <span
                    key={wi}
                    ref={(el) => {
                      if (el) wordRefs.current[k][wi] = el;
                    }}
                    className="inline-block will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    {word}
                    {wi < slide.title.split(" ").length - 1 && " "}
                  </span>
                ))}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed tracking-tight text-white/60 sm:text-base">
                <span
                  ref={(el) => {
                    if (el)
                      wordRefs.current[k][slide.title.split(" ").length] = el;
                  }}
                  className="inline-block will-change-transform"
                  style={{ opacity: 0 }}
                >
                  {slide.caption}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* step counter */}
        <div className="absolute bottom-24 right-6 z-20 flex items-baseline gap-1 sm:right-12 lg:right-24">
          <span
            ref={stepRef}
            className="tabular-nums text-3xl font-semibold tracking-tight text-white/90 sm:text-4xl"
          >
            01
          </span>
          <span className="tabular-nums text-sm tracking-tight text-white/50">
            / {fmtStep(SLIDES.length - 1)}
          </span>
        </div>
      </div>
    </section>
  );
}
