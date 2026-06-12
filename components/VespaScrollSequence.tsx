"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_COLORS, TOTAL_FRAMES } from "@/lib/frameColors";

const frameSrc = (i: number) => `/sequence/vespa_${i}_exploded.webp`;

/* ---------------------------------- text overlays ---------------------------------- */

type Section = {
  /** scroll progress at which the section peaks */
  at: number;
  align: "center" | "left" | "right";
  eyebrow?: string;
  title: string;
  body?: string;
};

const SECTIONS: Section[] = [
  {
    at: 0.0,
    align: "center",
    eyebrow: "Vespa Primavera Heritage · 1968",
    title: "La Dolce Vita. Reborn.",
    body: "Scroll to take it apart.",
  },
  {
    at: 0.3,
    align: "left",
    eyebrow: "Monocoque",
    title: "Hand-pressed steel monocoque. One frame, zero compromises.",
  },
  {
    at: 0.6,
    align: "right",
    eyebrow: "Engineering",
    title:
      "Every chrome bolt, every drum brake fin — engineered in 1968, perfected forever.",
  },
  {
    at: 0.9,
    align: "center",
    eyebrow: "The Legend",
    title: "Vespa Primavera Heritage. Ride the legend.",
    body: "Limited heritage series. Numbered. Hand-finished.",
  },
];

function TextOverlay({
  section,
  progress,
  isLight,
}: {
  section: Section;
  progress: MotionValue<number>;
  isLight: boolean;
}) {
  const { at, align } = section;
  // hero stays visible from the very top; the others fade in around their peak
  const fadeIn = at === 0 ? [0, 0.001] : [at - 0.1, at - 0.03];
  const fadeOut = at >= 0.9 ? [2, 3] : [at + 0.05, at + 0.12];
  const opacity = useTransform(
    progress,
    [...fadeIn, ...fadeOut],
    [at === 0 ? 1 : 0, 1, 1, 0]
  );
  const y = useTransform(progress, [fadeIn[0], fadeOut[1]], [40, -40]);

  const alignment =
    align === "center"
      ? "inset-x-0 max-w-none items-center text-center"
      : align === "left"
        ? "left-0 max-w-sm items-start text-left pl-6 sm:pl-12 lg:max-w-lg lg:pl-24"
        : "right-0 max-w-sm items-end text-right pr-6 sm:pr-12 lg:max-w-lg lg:pr-24";

  const heading = isLight ? "text-zinc-900/90" : "text-white/90";
  const muted = isLight ? "text-zinc-900/55" : "text-white/60";

  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute top-0 flex h-full flex-col justify-center gap-4 px-6 ${alignment}`}
    >
      {section.eyebrow && (
        <span
          className={`text-[11px] font-medium uppercase tracking-[0.35em] transition-colors duration-700 ${muted}`}
        >
          {section.eyebrow}
        </span>
      )}
      <h2
        className={`text-balance font-semibold leading-[1.05] tracking-tight transition-colors duration-700 ${
          align === "center"
            ? "text-4xl sm:text-6xl lg:text-7xl"
            : "text-2xl sm:text-3xl lg:text-4xl"
        } ${heading}`}
      >
        {section.title}
      </h2>
      {section.body && (
        <p
          className={`max-w-md text-base leading-relaxed tracking-tight transition-colors duration-700 sm:text-lg ${muted}`}
        >
          {section.body}
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------- loader -------------------------------------- */

function Loader({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gallery">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white/80" />
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.35em] text-white/60">
          Vespa Primavera Heritage
        </span>
        <span className="tabular-nums text-sm text-white/40">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

/* --------------------------------- main component ---------------------------------- */

export default function VespaScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameRef = useRef(-1);

  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [isLight, setIsLight] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  // spring smoothing removes scroll-wheel stepping without lagging behind
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 38,
    restDelta: 0.0005,
  });

  /* preload every frame before the experience starts */
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      const done = () => {
        if (cancelled) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded === TOTAL_FRAMES) setReady(true);
      };
      img.onload = done;
      img.onerror = done;
      images.push(img);
    }
    imagesRef.current = images;
    return () => {
      cancelled = true;
    };
  }, []);

  /* draw a frame: cover-fit so the image always fills the viewport,
     cropping symmetrically around the centered subject */
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.fillStyle = FRAME_COLORS[index].hex;
    ctx.fillRect(0, 0, width, height);

    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    // the scooter sits right of center in the footage — bias the crop there
    const FOCAL_X = 0.58;
    const x = Math.min(0, Math.max(width - w, width / 2 - FOCAL_X * w));
    ctx.drawImage(img, x, (height - h) / 2, w, h);
  }, []);

  const renderProgress = useCallback(
    (value: number) => {
      const frame = Math.max(
        0,
        Math.min(TOTAL_FRAMES - 1, Math.round(value * (TOTAL_FRAMES - 1)))
      );
      if (frame === lastFrameRef.current) return;
      lastFrameRef.current = frame;
      drawFrame(frame);

      // keep the page chrome in sync with the frame background
      const { hex, luminance } = FRAME_COLORS[frame];
      document.documentElement.style.setProperty("--scene-bg", hex);
      setIsLight(luminance > 0.55);
    },
    [drawFrame]
  );

  /* size the canvas to the viewport (devicePixelRatio-aware) */
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      lastFrameRef.current = -1;
      renderProgress(smoothProgress.get());
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ready, renderProgress, smoothProgress]);

  useMotionValueEvent(smoothProgress, "change", (value) => {
    if (ready) renderProgress(value);
  });

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      {!ready && <Loader progress={loadedCount / TOTAL_FRAMES} />}

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-screen w-full"
          aria-label="Vespa 125 Primavera disassembling and reassembling as you scroll"
          role="img"
        />

        {ready &&
          SECTIONS.map((section) => (
            <TextOverlay
              key={section.at}
              section={section}
              progress={smoothProgress}
              isLight={isLight}
            />
          ))}

        {/* scroll hint */}
        {ready && (
          <motion.div
            style={{ opacity: scrollHintOpacity }}
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3"
          >
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.4em] transition-colors duration-700 ${
                isLight ? "text-zinc-900/55" : "text-white/60"
              }`}
            >
              Scroll
            </span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className={`h-8 w-px transition-colors duration-700 ${
                isLight ? "bg-zinc-900/40" : "bg-white/40"
              }`}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
