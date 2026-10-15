# Vespa Primavera Heritage

<!-- looz-design-credit -->
> Progettato e sviluppato da **[LOoz.design](https://looz.design/?utm_source=github&utm_medium=referral&utm_campaign=readme)**: siti web, gestionali e agenti AI per piccole attività.
> *Designed and built by LOoz.design: websites, management tools and AI agents for small businesses.*
>
> **Demo online:** https://vespa-heritage.vercel.app/ · **Scheda del progetto · Case study:** https://looz.design/work/vespa-heritage
<!-- /looz-design-credit -->

High-end scrollytelling landing page for a fictional heritage edition of the
1968 Vespa 125 Primavera.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Framer Motion · HTML5 Canvas

## Experience

1. **Exploded scroll sequence** — a sticky canvas plays a 120-frame webp
   sequence of the Vespa disassembling and reassembling, driven by scroll
   (`components/VespaScrollSequence.tsx`). The page background and text theme
   sync to the sampled edge color of the current frame (`lib/frameColors.ts`),
   so the canvas blends seamlessly into the page.
2. **The Collection** — a pinned gradient-mask "slash" reveal
   (`components/VespaColorReveal.tsx`): each color edition is squeezed into a
   hard-edged diagonal slash, cuts to black, then the next photo blooms from
   the center outward. Titles wipe word by word with a synced step counter.

## Development

```bash
npm install
npm run dev
```

### Regenerating the frame sequence

The webp frames in `public/sequence/` and `lib/frameColors.ts` are generated
from the source JPGs (kept locally, not in the repo):

```bash
npm run frames
```

## Deploy (Vercel)

The project is a standard Next.js app — import the GitHub repo in Vercel and
deploy with the default settings (framework preset: Next.js). Frame and photo
assets are served from `public/` with immutable cache headers
(`next.config.mjs`).
