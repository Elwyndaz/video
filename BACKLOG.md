# Backlog

## Now

- [ ] `[P1]` LinkedIn Post Inspector on `https://orgutveckling.se/video/myter/`, confirm `og.png` renders (needs Patrik's login).

## Later

- [ ] `[P3]` Pages say "ca en minut" (`docs/index.html` register, `docs/myter/index.html` eyebrow, meta description, video aria-label) but the film is 81,6 s, and the player shows 1:21: Patrik's call on wording.
- [ ] `[P3]` MBTI flip (ENFP to INTJ changes three letters, a one-letter flip is the typical case): Patrik's call on wording.
- [ ] `[P3]` Link to `/video/` from the main site, if the films should be findable without a shared link. Pages are `noindex` today.
- [ ] `[P3]` UX audit 2026-11-24, both warns sit in the chrome copied from the main site, so they are fixed there first and copied here (Patrik's call, design lives in `elwyndaz.github.io`): Fitts, logo link 24 px, "Öppna meny" 32 px, "Stäng meny" 28 px, footer links 19 to 22 px (spaced, pass WCAG 2.5.8); Von Restorff, three primary-styled actions per page (`.mobile-nav-cta`, `.btn-primary` "Begär förslag" in the closing band, `.cta-email`), on `/video/` and `/video/myter/`.

## Built

- 2026-11-25 scenario hunt: the 404 page under `/video/` links to the films (a link with a trailing ")" or a retyped "Myter" had no way on), `check:pages` requires it and failed on live before; `site.js?v=2026-11-25` copied from the main site (see HANDOFF).
- 2026-11-25 speed pass: `/video/myter/` poster as preloaded WebP (173 to 45 kB); live LCP at 390 px, Slow 4G, CPU 4x 4436 to 1900 ms, transfer 404 to 276 kB; axe 0 on three pages at 390 and 1440 (see HANDOFF).
- 2026-11-24 bug hunt 2: Swedish `docs/404.html` for missing paths under `/video/` (was GitHub's English page, overflowing at 320), `check:pages` walks it and failed on live before; `preview.mjs` keeps `?v=` on live fetches and reads `/forskning/` live (see HANDOFF).
- 2026-11-24 bug hunt: onward row count 230 to 245 påståenden, borrowed `/style.css` and `/site.js` now carry the main site's `?v=`; `check:pages` catches both drifts (failed on live before, see HANDOFF).

- Remotion project with the `Myter` film (81,6 s, 1080×1080), synthesised score and cues.
- `/video/myter/` page: self-hosted video, film and heading in one centred column, onward rows to research and courses, closing request band.
- `/video/` register page.
- `npm run check:pages`: four widths per page, fails on console errors, overflow, a video that will not play, an axe WCAG 2.2 AA violation or header, menu and footer links that differ from the main site.
