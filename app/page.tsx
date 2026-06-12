import VespaScrollSequence from "@/components/VespaScrollSequence";
import VespaColorReveal from "@/components/VespaColorReveal";

export default function Home() {
  return (
    <main>
      {/* fixed brand mark */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 sm:px-12">
        <span className="text-sm font-semibold tracking-tight text-white/90 mix-blend-difference">
          VESPA<span className="text-white/60 mix-blend-difference"> · HERITAGE</span>
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/60 mix-blend-difference">
          Est. 1968
        </span>
      </header>

      <VespaScrollSequence />

      {/* bridge into the color collection */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/60">
          Four shades of spring
        </span>
        <h2 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-white/90 sm:text-5xl">
          One legend. Every color of la dolce vita.
        </h2>
      </section>

      <VespaColorReveal />

      {/* closing section */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center gap-8 px-6 pb-24 pt-12 text-center">
        <p className="max-w-xl text-balance text-lg leading-relaxed tracking-tight text-white/60">
          Two hundred and forty numbered machines. Original tooling, original
          steel, original soul — restored by hand in Pontedera, Italy.
        </p>
        <a
          href="#"
          className="rounded-full border border-white/20 px-8 py-3 text-sm font-medium tracking-tight text-white/90 transition hover:border-white/50 hover:bg-white/5"
        >
          Reserve yours
        </a>
        <footer className="mt-16 text-[11px] uppercase tracking-[0.35em] text-white/30">
          Vespa Primavera Heritage — a fictional concept
        </footer>
      </section>
    </main>
  );
}
