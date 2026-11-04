# Video

Short films for Centrum för Organisationsutveckling, made in code, and the pages they are shared from. Live at `https://orgutveckling.se/video/`.

## What it is

- One Remotion project (React, each frame is a pure function of the frame number) that renders every film.
- One static page per film under `docs/`, served by GitHub Pages from `main` `/docs`. The repo is a project site under the `elwyndaz.github.io` user site, which is why it lands on `orgutveckling.se/video/`.
- Purpose of each page: let someone watch the film from a link, then click on to the research summary (`/forskning/`) and to the courses (`/utbildningar.html`).

## Layout

| Path | Content |
|---|---|
| `src/Root.tsx` | One `Composition` per film |
| `src/<film>/` | The film: `script.ts` (all text), `Film.tsx` (timing, layout), `art.ts` (drawing) |
| `scripts/<film>-audio.mjs` | Synthesises music and cues into `public/<film>/` (gitignored, rebuilt by `npm run prep`) |
| `docs/<film>/` | `index.html`, the rendered `mp4`, `poster.jpg`, `og.png`. Committed: this is what is served |
| `docs/index.html` | Register of all films |
| `docs/video.css` | Only what the film pages add to the main site's design system |
| `scripts/preview.mjs`, `scripts/check-pages.mjs` | Local preview with the production CSP, and the page check |
| `scripts/art.test.mjs` | `npm test`: invariants for `art.ts` and the text timing in `Film.tsx` |

## Conventions

- **The pages borrow the main site.** `/style.css`, `/site.js`, fonts, header, footer and the closing "Begär förslag" band come from `elwyndaz.github.io` by absolute path on the same domain. Design rules live in that repo's `CONTEXT.md` and are not repeated here. Header, nav and footer markup is copied, so a nav change there must be copied here.
- **CSP is set on the Cloudflare zone**, not here: `default-src 'self'`, no external embeds. Video is self-hosted for that reason. No YouTube or Vimeo iframes, no inline scripts.
- **Film pages are `noindex, follow`.** They are landing pages for shared links, not search content, and are not in the main site's sitemap.
- **URLs are folders** (`/video/myter/`), never renamed after sharing: GitHub Pages cannot redirect.
- **Films are readable without sound.** All dialogue is on-screen text; music and cues are decoration.
- **Every claim in a film is a claim in the research summary** (`C:\dev\forskning`), worded no stronger than it is there.
- Swedish text: no em-dash, decimal comma, space as thousands separator.

## Films

| Film | Composition | Length | Format |
|---|---|---|---|
| `myter` | `Myter` | 81,6 s (2448 frames at 30 fps) | 1080×1080, 150 BPM grid: 1 bar = 48 frames |

`myter`: pixel art drawn procedurally as rects on a logical grid (135 px square shown, 8 screen px per logical px), one SVG with `viewBox` as camera. Characters Liv, Nadja, Göran and Mira come from the game Kontoret, but the film does not link to the game.

## Audits
- Secrets: 2026-10-30, pass, gitleaks 0 findings in 10 commits
- Actions: 2026-10-30, n/a, no GitHub Actions workflows
- npm audit: 2026-10-30, fail, 0 critical 10 high 0 moderate in production, 0 in the dev chain
- Dependabot: 2026-10-30, fail, 5 open alerts: 1 high 2 medium 2 low runtime, 0 dev (fast-uri, zod)
- Headers (automated): 2026-10-30, pass, 6 of 6 on orgutveckling.se/video, Observatory A+ on orgutveckling.se
- WCAG 2.2 AA (automated): 2026-11-04, needs-review, axe 4.14.0 0 violations on orgutveckling.se/video (2 pages, 4 widths each, via check-pages); manual keyboard pass not done
- UX (automated): 2026-10-30, warn, 4 of 6 script checks pass on orgutveckling.se/video (no --interact): warn Fitts targets; warn Von Restorff primary; screenshot review not done
- OWASP Top 10: 2026-10-30, pass, code review (Mistral Large; Claude read only the verdict line, lows unread), no live probe; 0 high, 0 medium reported
- Mutation: 2026-11-04, Stryker 56,06 % on src/myter/art.ts (no tests before), 312 survivors reviewed: pixel coordinates, colours and per-character details only a still can judge

## Compute
Vart ledig kvot kan gå. Läses av fliken Compute i elwyn-dash och `tools/compute-queue.mjs` i aifabriken.

- Skapa: oändlig, fler kortfilmer för orgutveckling.se/video/
