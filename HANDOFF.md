---
schemaVersion: 1
status: active
currentGoal: "Patrik shares the Myter film; he has watched it and approved it."
nextAction: "Patrik runs https://www.linkedin.com/post-inspector/ on the URL before posting."
blockers: []
reviewedAt: 2026-10-17
---

# Handoff

Live since 2026-10-09: `https://orgutveckling.se/video/` and `https://orgutveckling.se/video/myter/`. GitHub Pages serves `main` `/docs` of `Elwyndaz/video`. `node scripts/check-pages.mjs https://orgutveckling.se` passed 8 of 8 after the first deploy.

The film was reviewed by a critic agent before publishing. Three verdicts claimed more than the live `/forskning` entries and were reworded; the stamp went from "INGEN EFFEKT" to "INGET STÖD"; the title card no longer names the game.

Patrik watched the film 2026-10-09 and approved it. At his request the page shows only the film (no verdict list, no transcript), and the sju procent verdict reads "Forskaren bakom siffrorna säger själv att de inte gäller så."

Not verified yet: the LinkedIn link preview.

The first version in the kontoret repo (`film/`) was removed 2026-10-09; this repo is the only copy.


## Beroendeuppdatering 2026-10-17

- Remotion 4.0.536, react/react-dom 19.3.1, playwright 1.64.1, typescript 7.0.2 (Go-versionen) utan kodändringar. `npm run check` och `remotion compositions` gröna före och efter, `npm audit` 0.

## Förbättringsrunda 2026-11-04

- `preview.mjs`: CSP:n är nu en kopia av zonens (den tidigare tillät `'unsafe-inline'` i `script-src`, vilket produktionen inte gör). Inga `C:/`-sökvägar längre: huvudsajten läses från `MAIN_SITE`, en syskonklon eller live. Byte ranges för mp4.
- `check-pages.mjs`: axe WCAG 2.2 AA och kontroll av länkförhandsvisningens taggar och `og.png` på varje sida och bredd. `CHROMIUM=` för extern webbläsare. 8 av 8 ok lokalt; live 8 av 8 före taggändringen.
- Sidorna: `twitter:*` och `og:image:type` som på huvudsajten, pilarna i registerraderna `aria-hidden`.
- Efter merge och deploy: `node scripts/check-pages.mjs https://orgutveckling.se` ska ge 8 av 8 (live saknar twitter-taggarna tills dess och fallerar på dem).
- Inte gjort: Remotion-beroendenas 10 high i `npm audit` (kräver Remotion-uppgradering), LinkedIn Post Inspector.
