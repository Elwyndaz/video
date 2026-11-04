// Invariants for the drawn picture (src/myter/art.ts) and the text timing in Film.tsx. Run: npm test
// They do not judge how the film looks; stills do that (AGENTS.md). They catch what a still can miss:
// half pixels, a mirrored sprite that drifts, a lift that moves the shadow, parallax that leaks into the room.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { FLOOR, HOME, WORLD, foreground, office, person, stations } from "../src/myter/art.ts";
import { beats, outro } from "../src/myter/script.ts";

const WHO = ["nadja", "liv", "goran", "mira"];
const POSES = ["stand", "walk", "sit", "cast", "power"];
const WINDOWS = [[8, 128], [318, 462]];
const key = (r) => r.join(",");
const diff = (a, b) => {
  const bs = new Set(b.map(key));
  return a.filter((r) => !bs.has(key(r)));
};

function wellFormed(rects, where) {
  assert.ok(rects.length > 0, where + ": draws something");
  for (const [x, y, w, h, c, o] of rects) {
    const at = `${where} [${x},${y},${w},${h},${c},${o}]`;
    assert.ok([x, y, w, h].every(Number.isInteger), at + ": whole logical pixels (crispEdges)");
    assert.ok(w > 0 && h > 0, at + ": positive size");
    assert.match(c, /^#([0-9a-f]{3}|[0-9a-f]{6})$/, at + ": hex colour");
    assert.ok(o === undefined || (o > 0 && o <= 1), at + ": opacity in (0, 1]");
  }
}

test("person: whole pixels, every who, pose and frame", () => {
  for (const who of WHO)
    for (const pose of POSES)
      for (const dir of [1, -1])
        for (const f of [0, 13, 40, 77, 110])
          for (const talk of [false, true]) wellFormed(person(who, { x: 100, dir, pose, f, step: f, talk, lift: f % 7, phones: f > 50 }), `${who} ${pose} ${dir} ${f}`);
});

test("person: shadow first, feet on the floor, lift raises the body and not the shadow", () => {
  for (const who of WHO)
    for (const pose of ["stand", "walk", "cast", "power", "sit"]) {
      const a = { x: 80, dir: 1, pose, f: 0, step: 0 };
      const flat = person(who, a);
      assert.deepEqual(flat[0], [75, FLOOR, 10, 1, "#000", 0.3], `${who} ${pose}: shadow centred under x`);
      assert.equal(Math.max(...flat.slice(1).map(([, y, , h]) => y + h)), FLOOR, `${who} ${pose}: lowest pixel touches the floor`);
      const up = person(who, { ...a, lift: 5 });
      assert.deepEqual(up[0], flat[0], `${who} ${pose}: shadow stays`);
      assert.deepEqual(up.slice(1), flat.slice(1).map(([x, y, w, h, c, o]) => [x, y - 5, w, h, c, o]), `${who} ${pose}: body rises 5`);
    }
});

test("person: facing left is the exact mirror of facing right", () => {
  for (const who of WHO)
    for (const pose of POSES) {
      const a = { x: 123, pose, f: 21, step: 1, talk: true };
      const right = person(who, { ...a, dir: 1 });
      const left = person(who, { ...a, dir: -1 });
      assert.deepEqual(left, right.map(([x, y, w, h, c, o]) => [2 * a.x - x - w, y, w, h, c, o]), `${who} ${pose}`);
    }
});

test("person: moving x moves every pixel the same", () => {
  const a = { dir: 1, pose: "walk", f: 9, step: 2 };
  assert.deepEqual(person("liv", { ...a, x: 47 }), person("liv", { ...a, x: 40 }).map(([x, ...rest]) => [x + 7, ...rest]));
});

test("person: walk cycle of four steps, both feet down on 0 and 2, repeats", () => {
  const at = (step) => key(person("nadja", { x: 0, dir: 1, pose: "walk", f: 0, step }).flat());
  assert.equal(at(2), at(0), "steps 0 and 2 are the same contact pose");
  assert.equal(new Set([0, 1, 3].map(at)).size, 3, "steps 1 and 3 differ from it and from each other");
  assert.equal(at(4), at(0), "step 4 is step 0");
  assert.equal(at(7), at(3));
  assert.equal(key(person("nadja", { x: 0, dir: 1, pose: "walk", f: 0 }).flat()), at(0), "no step is phase 0");
  const lifted = (step) => person("nadja", { x: 0, dir: 1, pose: "walk", f: 0, step }).slice(1).filter(([, y, , h]) => y + h === FLOOR).length;
  assert.ok(lifted(1) < lifted(0) && lifted(3) < lifted(0), "a foot leaves the floor on steps 1 and 3");
});

test("person: the mouth opens every other 4 frames while talking, never when silent", () => {
  const MOUTH = "#4a1f24";
  const open = (f, talk) => person("liv", { x: 0, dir: 1, pose: "stand", f, talk }).some((r) => r[4] === MOUTH);
  assert.deepEqual([0, 3, 4, 7, 8].map((f) => open(f, true)), [false, false, true, true, false]);
  assert.equal(open(4, false), false);
  assert.ok(person("goran", { x: 0, dir: 1, pose: "stand", f: 0 }).some((r) => r[4] === "#7a7a80"), "Göran's closed mouth is grey");
});

test("person: Nadja blinks for four frames in every 110", () => {
  const eyes = (f) => person("nadja", { x: 0, dir: 1, pose: "stand", f }).filter((r) => r[2] === 1 && r[3] === 1 && r[4] === "#11141f").length;
  const shut = [];
  for (let f = 0; f < 220; f++) if (eyes(f) === 0) shut.push(f);
  assert.deepEqual(shut, [73, 74, 75, 76, 183, 184, 185, 186]);
  assert.equal(eyes(0), 2, "two eyes open");
});

test("person: breathing moves the body one pixel, offset per character, never while walking", () => {
  const top = (who, pose, f) => person(who, { x: 0, dir: 1, pose, f }).find((r) => r[2] === 8 && r[3] >= 9)[1];
  // Liv has seed 2: the phase flips where (f + 34) crosses a multiple of 40.
  assert.equal(top("liv", "stand", 6) - top("liv", "stand", 0), 1, "breath in at f 6");
  assert.equal(top("liv", "stand", 46) - top("liv", "stand", 6), -1, "out again at f 46");
  assert.equal(top("liv", "sit", 6) - top("liv", "sit", 0), 1, "sitters breathe too");
  assert.equal(top("liv", "walk", 6), top("liv", "walk", 0), "no breathing while walking");
  assert.equal(top("liv", "sit", 0) - top("liv", "stand", 0), 4, "sitting is four pixels lower");
});

test("person: arms follow the pose", () => {
  const ARM = "#33663a";
  const arms = (pose, f, talk) => person("liv", { x: 0, dir: 1, pose, f, talk }).filter((r) => r[4] === ARM);
  assert.equal(arms("cast", 0).length, 3, "cast: one arm down, one raised in two pieces");
  assert.equal(arms("stand", 0, true).length, 3, "talking standing gestures on even 14-frame halves");
  assert.equal(arms("stand", 14, true).length, 2, "and rests on odd ones");
  assert.equal(arms("stand", 28, true).length, 3, "every other half, not just the first");
  assert.equal(arms("stand", 0, false).length, 2, "silent: both arms down");
  assert.equal(arms("sit", 0, false).filter(([, , w, h]) => w > h).length, 1, "a silent sitter types: one forearm on the desk");
  assert.equal(arms("sit", 0, true).filter(([, , w, h]) => w > h).length, 0, "and lets go to talk");
  const power = arms("power", 0);
  assert.equal(power.length, 2, "power pose: two arms");
  for (const [, y, , h] of power) assert.ok(y + h <= FLOOR - 18, "both above the shoulders");
  assert.equal(person("goran", { x: 0, dir: 1, pose: "stand", f: 0, phones: true }).filter((r) => r[4] === "#11141f").length,
    person("goran", { x: 0, dir: 1, pose: "stand", f: 0 }).filter((r) => r[4] === "#11141f").length + 1, "headphones replace the collar");
});

test("person: faces the way dir says", () => {
  const reach = (dir) => person("nadja", { x: 100, dir, pose: "cast", f: 0 }).filter((r) => r[4] === "#f0c8a0").map(([x, , w]) => [x, x + w]).flat();
  assert.equal(Math.max(...reach(1)), 111, "dir 1: the raised hand is to the right");
  assert.equal(Math.min(...reach(-1)), 89, "dir -1: to the left");
});

test("person: only walking moves the legs, and the walk bobs", () => {
  for (const pose of ["stand", "cast", "sit", "power"])
    assert.deepEqual(person("nadja", { x: 0, dir: 1, pose, f: 0, step: 1 }), person("nadja", { x: 0, dir: 1, pose, f: 0, step: 0 }), `${pose}: step is ignored`);
  const head = (step) => person("nadja", { x: 0, dir: 1, pose: "walk", f: 0, step }).find((r) => r[2] === 8 && r[3] === 8)[1];
  assert.equal(head(1) - head(0), -1, "up one pixel mid-stride");
  assert.equal(head(3) - head(2), -1);
});

test("person: a sitter has a chair back that turns with them", () => {
  const back = (dir) => person("liv", { x: 100, dir, pose: "sit", f: 0 }).filter((r) => r[2] === 2 && r[3] === 12 && r[4] === "#11141f").map((r) => r[0]);
  assert.deepEqual(back(1), [93]);
  assert.deepEqual(back(-1), [105]);
  assert.deepEqual(person("liv", { x: 100, dir: 1, pose: "stand", f: 0 }).filter((r) => r[2] === 2 && r[3] === 12), [], "no chair when standing");
});

test("office: whole pixels inside the world", () => {
  for (const f of [0, 29, 30, 119, 500])
    for (const camX of [0, 77, 213, WORLD - 135]) {
      const r = office(f, camX);
      wellFormed(r, `office ${f} ${camX}`);
      for (const [x, , w] of r) assert.ok(x >= 0 && x + w <= WORLD, `office ${f} ${camX}: x ${x} w ${w} inside 0..${WORLD}`);
    }
});

test("office: same frame and camera give the same picture", () => {
  assert.deepEqual(office(321, 99), office(321, 99));
});

test("office: the camera only moves the skyline, and the skyline stays inside the windows", () => {
  const a = office(0, 0);
  const b = office(0, 180);
  const moved = [...diff(a, b), ...diff(b, a)];
  assert.ok(moved.length > 0, "parallax moves something");
  for (const [x, , w] of moved) assert.ok(WINDOWS.some(([x0, x1]) => x >= x0 && x + w <= x1), `skyline pixel at ${x} inside a window`);
  // The skyline is far away: it follows the camera at 0,6, so on screen it slides at 0,4 of the room.
  const towers = (camX) => office(0, camX).filter((r) => r[4] === "#262d50" && r[1] + r[3] === 72).map(([x, , w, h]) => [x, w, h].join(","));
  const at0 = new Set(towers(0));
  const shifted = towers(50).filter((t) => at0.has(t.replace(/^-?\d+/, (x) => String(Number(x) - 30))));
  assert.ok(shifted.length >= towers(50).length / 2, `${shifted.length} of ${towers(50).length} towers moved 30 for 50`);
});

test("office: the clock ticks every second and comes round in four", () => {
  const tick = (f) => office(f, 0).find((r) => r[4] === "#d65f56" && r[2] === 1 && r[3] === 1).slice(0, 2).join(",");
  assert.deepEqual([0, 29, 30, 60, 90, 120].map(tick), ["151,30", "151,30", "155,33", "151,37", "148,33", "151,30"]);
});

test("office: a desk at every colleague's station", () => {
  const r = office(0, 0);
  for (const s of Object.values(stations)) assert.ok(r.some(([x, y, w, h, c]) => x === s - 4 && y === 107 && w === 8 && h === 2 && c === "#11141f"), `chair at ${s}`);
  assert.ok(HOME < Math.min(...Object.values(stations)), "Nadja starts left of everyone");
});

test("foreground: leaves slide at 0,3 of the camera", () => {
  const a = foreground(0);
  wellFormed(a, "foreground");
  assert.deepEqual(foreground(100), a.map(([x, ...rest]) => [x - 30, ...rest]));
  assert.deepEqual(foreground(15), a.map(([x, ...rest]) => [x - 4, ...rest]), "4,5 rounds to whole pixels");
});

// Film.tsx cannot load in Node (fonts, JSX). Its timing constants are read from the source instead.
test("text: every line is fully typed with at least a second left to read", () => {
  const src = readFileSync(new URL("../src/myter/Film.tsx", import.meta.url), "utf8");
  const c = {};
  for (const name of ["BAR", "ARRIVE", "LINE", "REPLY", "STAMP", "VERDICT", "LINGER", "CHARS_PER_FRAME", "BEAT"]) {
    const expr = src.match(new RegExp(`const ${name} = ([^;]+);`))[1];
    c[name] = Function(...Object.keys(c), `return ${expr}`)(...Object.values(c));
  }
  const typed = (s) => 6 + Math.ceil(s.length / c.CHARS_PER_FRAME);
  const READ = 30;
  for (const b of beats) {
    assert.ok(typed(b.line) + READ <= c.REPLY - c.LINE - 4, `line: ${b.line}`);
    assert.ok(typed(b.reply[1]) + READ <= c.BEAT - c.REPLY - 30, `reply: ${b.reply[1]}`);
    assert.ok(typed(b.verdict) + READ <= c.BEAT + c.LINGER - c.VERDICT, `verdict: ${b.verdict}`);
  }
  assert.ok(typed(outro.line) + READ <= 80, `outro: ${outro.line}`);
});
