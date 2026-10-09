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
