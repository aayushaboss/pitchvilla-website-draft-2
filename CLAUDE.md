# Pitchvilla branch sites — rules

Design files live in `design-source/`. The Next.js site is generated from them: after editing a site page there, run `npm run convert` (see README.md).

100X Forge (`Pitchvilla Website v4.dc.html`) is the master reference for every branch sub-site.

- **Palette only:** #FBF8F1 (page), #F3EDE0 (alt sections/strip), #E9E1CF (image slots), #FFCC00 (accent/stat band/final CTA), #1C1410 (ink), #4A3F37 / #6B5E54 (muted). No dark sections, no new colours.
- **Type:** Poppins. Eyebrows 12px/600/0.14em uppercase "NN / Label". H2 clamp(26px,2.6vw,36px)/600/-0.015em (never tighter; big CTA headlines -0.025em, line-height ≥1.04).
- **Horizontal padding:** `max-width:1280px;margin:0 auto;padding:… clamp(24px,6vw,96px)` everywhere, with v4 base resets in helmet (`*{box-sizing:border-box}`, `html{scroll-behavior:smooth}`, antialiased body) so content width matches. Section vertical padding 112px (56px on mobile).
- **Animation & scroll reveal (copy v4 logic):** hero `[data-line]` rise + yellow `[data-sun]` rise; stat band count-up; `01 / The problem` statement word-by-word opacity on scroll; problem tiles diagonal reveal (numbers + underline, then title, then desc); `h2` and `[data-soft]` soft fade-up; `[data-stagger]` children staggered; selection steps sequential reveal; FAQ-style accordions with yellow underline. Scroll-check via getBoundingClientRect + interval, never class-only reveals.
- **No yellow marker underlines on headlines.**
- **CTAs:** only "Apply" (100X Forge) or "Enquire" (services) — no other CTA labels, no chevrons/arrows in CTA buttons. A text link beside a CTA is bottom-aligned with it (row align-items:flex-end; link padding-bottom = button bottom padding).
- **Heading scale:** the home hero line ("30 FOUNDERS…", max 48px) is the largest type site-wide. Every other h1/h2 caps at 40px (h1 clamp(30px,3vw,40px), big CTA h2 clamp(26px,2.6vw,36px)); sub-pages use compact heroes, not landing-page heroes.
- **Narrative structure:** Hero → stats → problem statement → problem tiles → "The answer" → how it works → what you get → who/proof → process/steps → FAQ-style → yellow CTA → footer.
- **Copy:** short and scannable; no long paragraphs.
- **Variation:** each branch keeps the same experience; only subtle layout variations (e.g. sun position, card vs list treatments), with a distinct hero.
- No branch hub. 100X Forge is the main site; every page uses the shared header: logo + "100X Forge" tag · About ▾ (About Pitchvilla, Apply, Interview guide, FAQ) · Home · Services ▾ mega menu (Launch, Grow, Raise, each with sub-items; pages without a page link to the enquiry form with that topic) · Blog · yellow Apply button.
