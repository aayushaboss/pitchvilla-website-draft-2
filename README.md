# Pitchvilla website

Next.js (App Router) version of the Pitchvilla / 100X Forge site.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## How it is put together

- `design-source/` is a copy of `Downloads/Pitchvilla` and holds the original `.dc.html` design files (plus decks, brochures, uploads and archive).
- `scripts/convert-dc.mjs` turns the 16 site pages into React components in `components/dc/` and routes in `app/`. Do not edit `components/dc/*` by hand: edit the design file and run `npm run convert`.
- `lib/dc-runtime.js` has the small helpers the generated components use.
- `public/` has the shared browser scripts (`motion.js`, `image-slot.js`, `autoscroll.js`), loaded once in `app/layout.jsx`.

## Routes

| Route | Design file |
| --- | --- |
| `/` | Pitchvilla Website v4 |
| `/about` | About |
| `/apply` | Apply |
| `/interview-prep` | Interview Prep |
| `/consulting` | Pitchvilla Consulting Group |
| `/services/idea-validation` | Idea Validation |
| `/services/launch-your-startup` | Launch Your Startup |
| `/services/pitch-deck-creation` | Pitch Deck Creation |
| `/services/business-strategy` | Business Strategy |
| `/services/financial-analysis` | Financial Analysis |
| `/services/digital-marketing` | Digital Marketing |
| `/services/hiring-and-team-building` | Hiring and Team Building |
| `/services/investor-readiness` | Investor Readiness |
| `/services/pitch-to-investors` | Pitch to Investors |
| `/privacy-policy` | Privacy Policy |
| `/terms-and-conditions` | Terms and Conditions |
