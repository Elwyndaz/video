// The synthesised sound (scripts/myter-audio.mjs): valid wav files, the score as long as the film, and the half-bar
// holes where Film.tsx drops the stamp. How it sounds is for a human ear (AGENTS.md); this checks what an ear can miss.
// Run: npm test (it rebuilds public/myter, like npm run prep).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { beats } from "../src/myter/script.ts";

const SR = 44100;
execFileSync(process.execPath, [fileURLToPath(new URL("myter-audio.mjs", import.meta.url))]);

function wav(name) {
  const b = readFileSync(new URL(`../public/myter/${name}`, import.meta.url));
  const n = (b.length - 44) / 2;
  return { b, n, at: (i) => b.readInt16LE(44 + i * 2) };
}

// Film.tsx cannot load in Node; its frame constants are read from the source, as in art.test.mjs.
const src = readFileSync(new URL("../src/myter/Film.tsx", import.meta.url), "utf8");
const c = { beats };
for (const name of ["BAR", "INTRO", "BEAT", "OUTRO", "TOTAL", "STAMP", "OUTRO_STAMP"]) {
  const expr = src.match(new RegExp(`const ${name} = ([^;]+);`))[1];
  c[name] = Function(...Object.keys(c), `return ${expr}`)(...Object.values(c));
}
const sample = (frame) => Math.round((frame / 30) * SR);
const silent = (w, from, to) => {
  for (let i = from; i < to; i++) if (w.at(i) !== 0) return false;
  return true;
};
const loud = (w, from, to) => {
  let m = 0;
  for (let i = from; i < to; i++) m = Math.max(m, Math.abs(w.at(i)));
  return m;
};
// Starts of sound after at least `gap` silent samples.
const onsets = (w, gap = 100) => {
  let quiet = gap, count = 0;
  for (let i = 0; i < w.n; i++) {
    if (w.at(i) === 0) quiet++;
    else {
      if (quiet >= gap) count++;
      quiet = 0;
    }
  }
  return count;
};
const crossings = (w, from, to) => {
  let k = 0;
  for (let i = from + 1; i < to; i++) if ((w.at(i - 1) < 0) !== (w.at(i) < 0)) k++;
  return k;
};

const LENGTHS = { "music.wav": null, "talk-hi.wav": 4, "talk-lo.wav": 4, "attack.wav": 0.7, "nope.wav": 1.2, "walk.wav": 1.5, "ping.wav": 0.5, "win.wav": 1.6 };

test("every file is a 16-bit mono PCM wav at 44,1 kHz, normalised to 85 % of full scale", () => {
  for (const name of Object.keys(LENGTHS)) {
    const { b, n, at } = wav(name);
    assert.equal(b.toString("ascii", 0, 4), "RIFF", name);
    assert.equal(b.readUInt32LE(4), b.length - 8, name + ": RIFF size");
    assert.equal(b.toString("ascii", 8, 16), "WAVEfmt ", name);
    assert.deepEqual([b.readUInt32LE(16), b.readUInt16LE(20), b.readUInt16LE(22), b.readUInt32LE(24), b.readUInt32LE(28), b.readUInt16LE(32), b.readUInt16LE(34)], [16, 1, 1, SR, SR * 2, 2, 16], name + ": fmt chunk");
    assert.equal(b.toString("ascii", 36, 40), "data", name);
    assert.equal(b.readUInt32LE(40), n * 2, name + ": data size");
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(at(i)));
    assert.equal(peak, Math.round(0.85 * 32767), name + ": peak");
  }
});

test("cue lengths", () => {
  for (const [name, s] of Object.entries(LENGTHS)) if (s) assert.equal(wav(name).n, Math.ceil(s * SR), name);
});

test("the score runs the whole film, the last chord rings to the last frame, then 1,5 s of padding", () => {
  const m = wav("music.wav");
  assert.ok(Math.abs(m.n - (c.TOTAL / 30 + 1.5) * SR) < 2, `${m.n} samples`); // 51 bars of 1,6 s is 81,6 plus float dust
  assert.ok(loud(m, sample(c.TOTAL) - SR / 2, sample(c.TOTAL) - 2) > 1000, "chord still ringing in the last half second");
  assert.ok(silent(m, sample(c.TOTAL) + 2, m.n), "padding after the last frame is silent");
  assert.ok(loud(m, 0, sample(c.BAR)) > 1000, "plays from the first bar");
});

test("the music leaves half a bar empty exactly where each stamp lands", () => {
  const m = wav("music.wav");
  const stamps = [...beats.map((_, i) => c.INTRO + i * c.BEAT + c.STAMP), c.OUTRO + c.OUTRO_STAMP];
  for (const f of stamps) {
    assert.ok(silent(m, sample(f), sample(f + c.BAR / 2)), `silence from frame ${f}`);
    assert.ok(loud(m, sample(f + c.BAR / 2), sample(f + c.BAR)) > 1000, `bass back at frame ${f + c.BAR / 2}`);
    assert.ok(loud(m, sample(f - c.BAR / 2), sample(f)) > 1000, `music before frame ${f}`);
  }
  // Nowhere else in the film does the music stop for a quarter bar.
  let run = 0, holes = 0;
  for (let i = 0; i < sample(c.TOTAL); i++) {
    run = m.at(i) === 0 ? run + 1 : 0;
    if (run === sample(c.BAR / 4)) holes++;
  }
  assert.equal(holes, stamps.length);
});

test("talk blips: one every fifteenth of a second, Nadja's higher than the others'", () => {
  for (const name of ["talk-hi.wav", "talk-lo.wav"]) assert.equal(onsets(wav(name)), 59, name);
  const blip = Math.round(0.035 * SR);
  const hi = crossings(wav("talk-hi.wav"), 0, blip);
  const lo = crossings(wav("talk-lo.wav"), 0, blip);
  assert.ok(hi > lo * 1.5, `hi ${hi} crossings, lo ${lo}`);
});

test("walk: seven footsteps", () => {
  assert.equal(onsets(wav("walk.wav")), 7);
});
