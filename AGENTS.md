# Repository instructions

Read `C:\dev\CLAUDE.md` first. What this repo is: `CONTEXT.md`.

## Verify

- `npm run check`: type-check.
- `npm run render`: rebuilds audio, renders `docs/myter/myter.mp4`.
- `npm run preview` in one terminal, `npm run check:pages` in another: every page at four widths, fails on console errors (CSP included), horizontal overflow or a video that will not play. After a push: `node scripts/check-pages.mjs https://orgutveckling.se`.
- A green check is not visual acceptance. Render stills (`npx remotion still src/index.ts Myter out/x.png --frame=N`) and look at them, and look at the page screenshots in `out/`.

## Learned the hard way

- **Pixelify Sans draws 5 as S and 2 as 8.** Running text and anything with digits uses the system sans. The pixel face is for headings and labels only.
- **Nobody has verified sound or motion by machine.** Stills and audio levels can be checked; how the music sounds and how the animation moves needs a human watching the mp4.
- **Remotion's bundled ffmpeg is stripped**: no `volumedetect`, no `s16le` muxer. Decode to wav and measure in Python.
- **Text speed**: the typewriter runs 2 characters per frame and a line needs to stay up after it finishes. The first cut was too fast to read; lengthen the beat before adding words.
- **`preview.mjs` has absolute paths** to `C:/dev/video/docs` and `C:/dev/elwyndaz.github.io`.
- **Committing the mp4 is deliberate** (Pages serves `/docs`). Each re-render adds about 11 MB to git history, so render when the film is right, not per tweak.
