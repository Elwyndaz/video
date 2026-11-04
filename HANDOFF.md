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


## Mutationstest 2026-11-04 (grenen `claude/mutation-2026-11-04`)

- Repot hade inga tester. `npm test` kör nu `scripts/art.test.mjs` (19 tester, Node utan beroenden): hela
  pixlar, spegling, lyft utan att skuggan flyttar, gångcykel, mun, blinkning, andning, armar per pose,
  parallax och klocka i `art.ts`, samt att varje replik och dom hinner skrivas klart med minst en sekund
  kvar (konstanterna läses ur `Film.tsx`, som inte går att ladda i Node).
- Stryker 9, command runner, bara `src/myter/art.ts`: **56,06 %** (före: inga tester). Kör:
  `npm i --no-save @stryker-mutator/core@9 && npx stryker run`, cirka 2 minuter.
- De 312 överlevande är koordinater, färger och detaljer per figur. Dem bedömer bara en still eller ett
  par ögon (se AGENTS.md); ett test som låser varje pixel vore en ögonblicksbild, inte en kontroll.
- Ingen kod i filmen ändrad, ingen omrendering, ingen bugg hittad.

## Beroendeuppdatering 2026-10-17

- Remotion 4.0.536, react/react-dom 19.3.1, playwright 1.64.1, typescript 7.0.2 (Go-versionen) utan kodändringar. `npm run check` och `remotion compositions` gröna före och efter, `npm audit` 0.
