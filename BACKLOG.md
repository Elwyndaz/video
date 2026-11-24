# Backlog

## Now

- [ ] `[P1]` LinkedIn Post Inspector on `https://orgutveckling.se/video/myter/`, confirm `og.png` renders (needs Patrik's login).

## Later

- [ ] `[P3]` MBTI flip (ENFP to INTJ changes three letters, a one-letter flip is the typical case): Patrik's call on wording.
- [ ] `[P3]` Link to `/video/` from the main site, if the films should be findable without a shared link. Pages are `noindex` today.
- [ ] `[P3]` UX audit 2026-11-24, both warns sit in the chrome copied from the main site, so they are fixed there first and copied here (Patrik's call, design lives in `elwyndaz.github.io`): Fitts, logo link 24 px, "Öppna meny" 32 px, "Stäng meny" 28 px, footer links 19 to 22 px (spaced, pass WCAG 2.5.8); Von Restorff, three primary-styled actions per page (`.mobile-nav-cta`, `.btn-primary` "Begär förslag" in the closing band, `.cta-email`), on `/video/` and `/video/myter/`.

## Built

- Remotion project with the `Myter` film (81,6 s, 1080×1080), synthesised score and cues.
- `/video/myter/` page: self-hosted video, film and heading in one centred column, onward rows to research and courses, closing request band.
- `/video/` register page.
- `npm run check:pages`: four widths per page, fails on console errors, overflow, a video that will not play or an axe WCAG 2.2 AA violation.
