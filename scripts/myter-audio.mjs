// Fills public/myter with the synthesised chiptune score and cues. The picture needs no files: it is drawn in src/myter/art.ts.
// 150 BPM at 30 fps makes one beat 12 frames and one bar 48, which is the grid Film.tsx cuts on.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public", "myter");
mkdirSync(pub, { recursive: true });

const SR = 44100;
const STEP = 0.1; // one sixteenth at 150 BPM
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// freq is a number or a function of progress 0..1 (for sweeps).
function tone(buf, t, dur, freq, wave, vol) {
  const a = Math.floor(t * SR);
  const n = Math.floor(dur * SR);
  let ph = 0;
  for (let i = 0; i < n && a + i < buf.length; i++) {
    ph = (ph + (typeof freq === "function" ? freq(i / n) : freq) / SR) % 1;
    const w = wave === "sq" ? (ph < 0.25 ? 1.5 : -0.5) : wave === "tri" ? 4 * Math.abs(ph - 0.5) - 1 : wave === "sin" ? Math.sin(2 * Math.PI * ph) : rnd();
    buf[a + i] += w * Math.min(1, i / 60) * Math.exp((-3 * i) / n) * vol;
  }
}

function save(name, buf) {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const out = Buffer.alloc(44 + buf.length * 2);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + buf.length * 2, 4);
  out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(buf.length * 2, 40);
  for (let i = 0; i < buf.length; i++) out.writeInt16LE(Math.round((buf[i] / peak) * 0.85 * 32767), 44 + i * 2);
  writeFileSync(join(pub, name), out);
}

const clip = (seconds) => new Float32Array(Math.ceil(seconds * SR));

// --- score: 51 bars. intro 3, five myths of 8, outro 8 ---
const chords = { C: [48, [72, 76, 79, 84]], Am: [45, [69, 72, 76, 81]], F: [41, [65, 69, 72, 77]], G: [43, [67, 71, 74, 79]] };
// "run" builds up, "hole" leaves half a bar empty: the "ingen effekt" cue lands there.
const myth = [["C", "full"], ["Am", "full"], ["F", "full"], ["G", "full"], ["C", "full"], ["Am", "run"], ["F", "hole"], ["G", "sparse"]];
const bars = [["C", "thin"], ["Am", "thin"], ["G", "full"], ...Array(5).fill(myth).flat(), ["C", "full"], ["Am", "full"], ["G", "run"], ["F", "hole"], ["F", "soft"], ["G", "soft"], ["Am", "soft"], ["C", "end"]];

const music = clip(bars.length * 16 * STEP + 1.5);
const kick = (t) => tone(music, t, 0.12, (p) => 140 - 95 * p, "sin", 0.5);
const snare = (t, vol = 0.2) => tone(music, t, 0.09, 0, "noise", vol);
const hat = (t) => tone(music, t, 0.03, 0, "noise", 0.07);
const riffs = [[0, 1, 2, 3, 2, 1, 2, 1], [3, 2, 1, 2, 0, 1, 2, 3]];

bars.forEach(([name, kind], b) => {
  const [bass, lead] = chords[name];
  const t0 = b * 16 * STEP;
  const at = (eighth) => t0 + eighth * 2 * STEP;
  if (kind === "end") {
    kick(t0);
    tone(music, t0, 1.6, hz(bass), "tri", 0.4);
    for (const m of lead) tone(music, t0, 1.6, hz(m), "sq", 0.09);
    return;
  }
  if (kind === "sparse") {
    for (const e of [0, 4]) tone(music, at(e), 0.5, hz(bass), "tri", 0.3);
    for (let e = 1; e < 6; e += 2) hat(at(e));
    for (let s = 12; s < 16; s++) snare(t0 + s * STEP, 0.08 + (s - 12) * 0.04);
    return;
  }
  if (kind === "hole") {
    tone(music, at(4), 0.5, hz(bass), "tri", 0.3);
    for (const e of [5, 7]) hat(at(e));
    return;
  }
  const leadVol = kind === "soft" ? 0.08 : 0.13;
  for (let e = 0; e < 8; e++) {
    tone(music, at(e), 0.18, hz(bass + (e % 2) * 12), "tri", 0.32);
    if (kind === "run" && e > 3) {
      for (const s of [0, 1]) {
        const n = (e - 4) * 2 + s;
        tone(music, at(e) + s * STEP, 0.09, hz(lead[n % 4] + (n > 3 ? 12 : 0)), "sq", 0.13);
        snare(at(e) + s * STEP, 0.06 + n * 0.015);
      }
      continue;
    }
    if (kind !== "thin" || b > 0) tone(music, at(e), 0.17, hz(lead[riffs[b % 2][e]]), "sq", leadVol);
    if (e % 2) hat(at(e));
    if (kind === "thin") continue;
    if (e % 4 === 0) kick(at(e));
    if (e % 4 === 2) snare(at(e), kind === "soft" ? 0.12 : 0.2);
  }
});
save("music.wav", music);

// --- cues ---
for (const [name, base] of [["talk-hi.wav", 880], ["talk-lo.wav", 494]]) {
  const buf = clip(4);
  for (let t = 0; t < 3.9; t += 1 / 15) tone(buf, t, 0.035, base * (1 + rnd() * 0.08), "sq", 0.2);
  save(name, buf);
}

const attack = clip(0.7);
tone(attack, 0, 0.25, (p) => 220 * 2 ** (3 * p), "sq", 0.2);
tone(attack, 0.22, 0.12, 0, "noise", 0.25);
tone(attack, 0.25, 0.4, 1568, "sq", 0.18);
save("attack.wav", attack);

const nope = clip(1.2);
tone(nope, 0, 0.14, (p) => 140 - 95 * p, "sin", 0.6);
tone(nope, 0.02, 0.2, 311, "sq", 0.2);
tone(nope, 0.24, 0.2, 233, "sq", 0.2);
tone(nope, 0.46, 0.6, (p) => 156 - 40 * p, "tri", 0.4);
save("nope.wav", nope);

const walk = clip(1.5);
for (let t = 0; t < 1.4; t += 0.2) tone(walk, t, 0.04, 180 + (Math.round(t * 5) % 2) * 60, "tri", 0.3);
save("walk.wav", walk);

const ping = clip(0.5);
tone(ping, 0, 0.08, 1760, "sq", 0.2);
tone(ping, 0.08, 0.3, (p) => 1320 - 900 * p, "tri", 0.3);
save("ping.wav", ping);

const win = clip(1.6);
[72, 76, 79, 84, 88].forEach((m, i) => tone(win, i * 0.09, 0.12, hz(m), "sq", 0.2));
for (const m of [72, 79, 84, 88]) tone(win, 0.45, 1, hz(m), "sq", 0.1);
save("win.wav", win);

console.log(`prep ok: ${(music.length / SR).toFixed(1)} s score`);
