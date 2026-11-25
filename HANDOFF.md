---
schemaVersion: 1
status: active
currentGoal: "Patrik shares the Myter film; he has watched it and approved it."
nextAction: "Patrik runs https://www.linkedin.com/post-inspector/ on the URL before posting."
blockers: []
reviewedAt: 2026-11-24
---

# Handoff

**2026-11-24, user bug hunt 2 (branch `hunt2/2026-11-24`, worktree `C:\dev\_wt\video-1124k`, complete):** walked what batch 6 did not: missing paths, slow network, second visit, every link. (1) A mistyped or truncated shared link under `/video/` (for example `/video/myte`) showed GitHub's English "Page not found" page: no nav, 380 px horizontal overflow at 320, axe violations. Now `docs/404.html`, a copy of the main site's `404.html` (origin/main, with its count-free Kunskap row), served with status 404. `check:pages` walks `/video/finns-inte/` too (status 404, Swedish title, chrome equal to the main site): against live before the fix it failed at all four widths. (2) Locally `check:pages` always failed on the claim count when a main-site checkout was used, because `/forskning/` is its own repo; `preview.mjs` now fetches `/forskning/` live. (3) Parked by batch 6: `preview.mjs` dropped `?v=` when fetching the main site live; now forwarded (fetch logged as `/style.css?v=2026-11-24b`). Checked without fault: all 26 internal links and assets 200, `/video/myter` 301 to the slash, mp4 206 on a range, live `video.css` equals the repo, no service worker, at 50 kB/s the video box holds its 350 px square before load and the film reports 81,6 s, reload and back from the register work, 0 console errors. `npm test` 37 of 37, `tsc` green, local `check:pages` 12 of 12. Live after push (Pages build 5c38c76): `/video/myte` answers 404 with "Sidan finns inte", `check-pages.mjs https://orgutveckling.se` 12 of 12. Open for Patrik: the pages say "ca en minut" for an 81,6 s film.

**2026-11-24, user bug hunt (branch `hunt/2026-11-24`, worktree `C:\dev\_wt\video-1124h`):** walked `/video/` and `/video/myter/` at 390 and 1440 (keyboard, menu, play, reload, back, blocked mp4). Two bugs a visitor sees, fixed: (1) the onward row said "230 påståenden", `/forskning/` says 245; (2) the pages loaded `/style.css` and `/site.js` without the main site's `?v=2026-11-24b`, and the edge served an older unversioned copy, so at 1440 Tab walked into the closed mobile menu and Escape did not close it at 390 (live on `/`, the versioned copy hides the closed menu). `check:pages` now fails when a film page's "N påståenden" differs from the `/forskning/` ingress, or the borrowed CSS/JS versions differ from the main site's `/`: against live before the fix it failed on both. `preview.mjs` fetches the main site without the query string, so locally it cannot show the asset fix; verified live after push: `check-pages.mjs https://orgutveckling.se` 8 of 8, Tab at 390 and 1440 skips the closed menu, opening it focuses "Stäng meny", Escape sets aria-expanded false. When the main site bumps `?v=`, `check:pages` fails until it is copied here.

**2026-11-24, feature pass (branch `feat/2026-11-24`, worktree `C:\dev\_wt\video-1124f`, complete):** the footer on `/video/` and `/video/myter/` lacked the main site's "Podd" link (`/podcast.html`), added. `check:pages` now compares every header, menu and footer link with the main site's `/` and fails on a difference; against live before the fix it failed on exactly that link, locally after it 8 of 8. `npm test` 36 of 36, `tsc` green. The open BACKLOG items all need Patrik (login or his call).

**2026-11-24, deep pass (branch `deep/2026-11-24`, worktree `C:\dev\video-deep-1124`, complete):** tests for the two untested scripts. `preview.mjs`: a malformed URL threw inside the request handler and took the server down; now a 400 and it keeps serving (test first), and `PORT=` moves it. Stryker 100 % on `preview.mjs`, 64,45 % on `myter-audio.mjs`; the audio test now deletes `public/myter` first, because it had been passing on files left by an earlier run. `npm test` 36 of 36, `tsc` green. UX script against live: 4 of 6, both warns in the chrome copied from the main site (BACKLOG P3). No backlog item was agent-doable: the rest are Patrik's calls. No page or film change, nothing to deploy.

**2026-11-24, backlog sweep (branch `sweep/2026-11-24`, worktree `C:\dev\video-sweep-1124`, complete):** no agent-doable P0-P2 item; the only open P1 (LinkedIn Post Inspector) needs Patrik's login. Rechecked: `tsc` green, `npm test` 19 of 19, `npm audit` 0, Dependabot 0 open, `check-pages.mjs` against live 8 of 8. Stale audit lines in `CONTEXT.md` (npm audit and Dependabot still said fail) brought up to date. No code or film change.

**2026-11-17, dependency round:** remotion and @remotion/* 4.0.536 to 4.0.544 (10 high to 0, zod advisory), playwright 1.65 and in-range updates. `tsc` green, `remotion compositions` lists Myter, `check-pages.mjs` against live passed 8 of 8. Film not re-rendered.

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

## Förbättringsrunda 2026-11-04

- `preview.mjs`: CSP:n är nu en kopia av zonens (den tidigare tillät `'unsafe-inline'` i `script-src`, vilket produktionen inte gör). Inga `C:/`-sökvägar längre: huvudsajten läses från `MAIN_SITE`, en syskonklon eller live. Byte ranges för mp4.
- `check-pages.mjs`: axe WCAG 2.2 AA och kontroll av länkförhandsvisningens taggar och `og.png` på varje sida och bredd. `CHROMIUM=` för extern webbläsare. 8 av 8 ok lokalt; live 8 av 8 före taggändringen.
- Sidorna: `twitter:*` och `og:image:type` som på huvudsajten, pilarna i registerraderna `aria-hidden`.
- Efter merge och deploy: `node scripts/check-pages.mjs https://orgutveckling.se` ska ge 8 av 8 (live saknar twitter-taggarna tills dess och fallerar på dem).
- Inte gjort: Remotion-beroendenas 10 high i `npm audit` (kräver Remotion-uppgradering), LinkedIn Post Inspector.
