// The whole picture is code: every function returns rectangles on a 180 px tall logical grid, one logical pixel drawn 6 px wide.
import type { Who } from "./script";

export type Rect = [x: number, y: number, w: number, h: number, c: string, o?: number];
export type Pose = "stand" | "walk" | "sit" | "cast" | "power";

export const FLOOR = 112;
export const WORLD = 560;
export const HOME = 60;
export const stations: Record<Exclude<Who, "nadja">, number> = { liv: 170, goran: 290, mira: 400 };

const INK = "#11141f";
const DARK = "#1c2236";
const CREAM = "#f2e7c7";
const AMBER = "#f2b94b";
const TEAL = "#69d2c7";
const WOOD = "#c79a55";

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const looks: Record<Who, { skin: string; hair: string; top: string; arm: string; legs: string; seed: number }> = {
  nadja: { skin: "#f0c8a0", hair: "#ead79c", top: "#e2a83a", arm: "#c98f2c", legs: "#262d4a", seed: 1 },
  liv: { skin: "#f2cfae", hair: "#5a3a28", top: "#3f7a44", arm: "#33663a", legs: "#2f3a5c", seed: 2 },
  goran: { skin: "#e8bf9a", hair: "#b4b4b8", top: "#a8472e", arm: "#8c3a26", legs: "#3a3f52", seed: 3 },
  mira: { skin: "#a8744e", hair: "#2a1c1a", top: "#9a3f8a", arm: "#803372", legs: "#262d4a", seed: 4 },
};

export interface Actor {
  x: number;
  dir: 1 | -1;
  pose: Pose;
  f: number;
  step?: number;
  talk?: boolean;
  lift?: number;
  phones?: boolean;
}

// Drawn facing right with the feet at (0, 0), then mirrored and moved into the world.
export function person(who: Who, a: Actor): Rect[] {
  const L = looks[who];
  const r: Rect[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string, o?: number) => r.push([x, y, w, h, c, o]);
  const sit = a.pose === "sit";
  const ph = a.pose === "walk" ? (a.step ?? 0) % 4 : 0;
  const breathe = a.pose !== "walk" && Math.floor((a.f + L.seed * 17) / 40) % 2 ? 1 : 0;
  const u = sit ? 4 + breathe : a.pose === "walk" ? -(ph % 2) : breathe;
  const shoe = who === "goran" ? "#5a3a22" : "#f2efe6";

  if (sit) {
    add(-7, -17, 2, 12, INK); // chair back, turns with the sitter
    add(-2, -8, 8, 3, L.legs);
    add(4, -5, 3, 5, L.legs);
    add(4, -1, 4, 1, shoe);
  } else {
    const spread = a.pose === "power" ? 1 : 0;
    const legs: Array<[x: number, lifted: boolean]> = [[-4 + [0, 2, 0, -2][ph] - spread, ph === 1], [1 + [0, -2, 0, 2][ph] + spread, ph === 3]];
    for (const [x, lifted] of legs) {
      add(x, -9, 3, lifted ? 7 : 9, L.legs);
      add(x, lifted ? -3 : -1, 4, 1, shoe);
    }
  }

  add(-4, -19 + u, 8, sit ? 9 : 11, L.top);
  if (who === "nadja") add(0, -19 + u, 3, sit ? 9 : 11, "#f4efe2");
  if (who === "liv") add(1, -19 + u, 2, 9, "#e9e4d6");
  if (who === "mira") add(1, -19 + u, 2, 2, "#c56ab4");
  if (who === "goran") for (const [x, y] of [[-3, -17], [1, -17], [-1, -15], [3, -15], [-3, -13], [1, -13]]) add(x, y + u, 2, 1, "#d98a3a");

  const gesture = a.pose === "cast" || (a.pose === "stand" && a.talk && Math.floor(a.f / 14) % 2 === 0);
  if (a.pose === "power") {
    add(-7, -24 + u, 2, 6, L.arm);
    add(-8, -27 + u, 2, 3, L.skin);
    add(5, -24 + u, 2, 6, L.arm);
    add(6, -27 + u, 2, 3, L.skin);
  } else {
    const swing = [0, 1, 0, -1][ph];
    add(-6 + swing, -19 + u, 2, 7, L.arm);
    add(-6 + swing, -12 + u, 2, 2, L.skin);
    if (sit && !a.talk) {
      add(3, -15, 6, 2, L.arm);
      add(9, -15, 2, 2, L.skin);
    } else if (gesture) {
      add(4, -19 + u, 3, 2, L.arm);
      add(6, -21 + u, 3, 2, L.arm);
      add(9, -23 + u, 2, 2, L.skin);
    } else {
      add(4 - swing, -19 + u, 2, 7, L.arm);
      add(4 - swing, -12 + u, 2, 2, L.skin);
    }
  }

  add(-1, -20 + u, 3, 1, L.skin);
  add(-4, -28 + u, 8, 8, L.skin);
  if (who !== "nadja") {
    add(-2, -26 + u, 3, 3, "#22222c");
    add(2, -26 + u, 3, 3, "#22222c");
    add(1, -25 + u, 1, 1, "#22222c");
    add(-1, -25 + u, 1, 1, "#e6f4f7");
    add(3, -25 + u, 1, 1, "#e6f4f7");
  }
  if (who === "nadja" && (a.f + L.seed * 37) % 110 > 3) {
    add(-1, -25 + u, 1, 1, INK);
    add(3, -25 + u, 1, 1, INK);
  }
  if (who === "goran") {
    add(-2, -23 + u, 6, 3, L.hair);
    add(-4, -24 + u, 2, 4, L.hair);
  }
  if (a.talk && Math.floor(a.f / 4) % 2) add(0, -22 + u, 3, 2, "#4a1f24");
  else add(0, -22 + u, 3, 1, who === "goran" ? "#7a7a80" : "#b8705c");

  if (who === "nadja") {
    add(-4, -30 + u, 8, 3, L.hair);
    add(0, -32 + u, 5, 2, L.hair);
    add(-4, -27 + u, 2, 2, "#c9b27a");
    add(-3, -23 + u, 1, 1, AMBER);
  } else if (who === "liv") {
    add(-5, -30 + u, 9, 3, L.hair);
    add(-5, -27 + u, 2, 6, L.hair);
    add(-7, -33 + u, 4, 4, L.hair);
  } else if (who === "mira") {
    add(-5, -30 + u, 10, 3, L.hair);
    add(-6, -28 + u, 3, 8, L.hair);
    add(-4, -35 + u, 7, 5, L.hair);
    add(-5, -33 + u, 1, 2, L.hair);
    add(3, -34 + u, 1, 2, L.hair);
    add(-3, -23 + u, 1, 1, AMBER);
  } else {
    add(-4, -29 + u, 8, 2, L.hair);
    if (a.phones) {
      add(-5, -30 + u, 9, 1, INK);
      add(-5, -27 + u, 2, 4, INK);
    } else {
      add(-4, -20 + u, 8, 2, INK);
    }
  }

  const lift = a.lift ?? 0;
  const out: Rect[] = r.map(([x, y, w, h, c, o]) => [a.x + (a.dir === 1 ? x : -x - w), FLOOR + y - lift, w, h, c, o]);
  out.unshift([a.x - 5, FLOOR, 10, 1, "#000", 0.3]);
  return out;
}

function plant(r: Rect[], x: number, pot: string) {
  const g1 = "#2f7a4a";
  const g2 = "#3f9a5a";
  for (const [dx, y, w, h, c] of [[-1, 92, 2, 12, g1], [-5, 95, 3, 2, g2], [-6, 97, 2, 5, g2], [2, 94, 3, 2, g2], [4, 96, 2, 6, g2], [-3, 89, 2, 5, g1], [1, 87, 2, 6, g2]] as const) r.push([x + dx, y, w, h, c]);
  r.push([x - 3, 104, 6, 8, pot], [x - 4, 104, 8, 1, pot]);
}

function desk(r: Rect[], s: number, who: string, f: number) {
  const add = (x: number, y: number, w: number, h: number, c: string, o?: number) => r.push([s + x, y, w, h, c, o]);
  add(-4, 107, 8, 2, INK); // chair seat, post and foot
  add(-1, 109, 2, 2, INK);
  add(-4, 111, 8, 1, INK);
  add(10, 101, 2, 11, DARK);
  add(28, 101, 10, 11, "#4a5070");
  add(31, 104, 4, 1, "#2a3048");
  add(31, 108, 4, 1, "#2a3048");
  add(9, 99, 30, 2, WOOD);
  add(9, 101, 30, 1, "#8f6a35");
  add(24, 97, 3, 2, INK);
  add(18, 86, 15, 11, INK);
  const code = who === "liv" ? ["#dfeef2", "#5a6a8a"] : ["#16203a", TEAL];
  add(19, 87, 13, 9, code[0]);
  for (let k = 0; k < 4; k++) add(20, 88 + k * 2, 3 + Math.floor(hash(k + Math.floor(f / 9) + s) * 8), 1, k % 3 ? code[1] : AMBER);
  add(12, 98, 6, 1, "#2a2e3c");
  if (who === "liv") {
    add(36, 90, 1, 9, INK);
    add(34, 88, 5, 2, AMBER);
    add(33, 90, 7, 9, AMBER, 0.08);
  } else if (who === "goran") {
    add(35, 96, 2, 3, "#f2efe6");
  } else {
    add(35, 96, 3, 3, "#c9703f");
    add(36, 92, 1, 4, "#3f9a5a");
    add(34, 93, 2, 1, "#3f9a5a");
    add(37, 94, 2, 1, "#3f9a5a");
  }
}

const WINDOWS = [[8, 128], [318, 462]] as const;
const SKY: Array<[y: number, h: number, c: string]> = [[22, 14, "#2c3566"], [36, 12, "#46508a"], [48, 10, "#7d6f9e"], [58, 8, "#c98a86"], [66, 6, "#f0b27a"]];
const POSTERS = [CREAM, "#3d5fa0", "#3f7a5a", "#d9772e", "#c06a9a", "#2f8f8a"];
const BINDERS = ["#c0453a", "#3d5fa0", AMBER, "#3f7a5a", "#e9e4d6"];

// Everything behind the characters. camX only feeds the skyline parallax.
export function office(f: number, camX: number): Rect[] {
  const r: Rect[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string, o?: number) => r.push([x, y, w, h, c, o]);

  for (const [x0, x1] of WINDOWS) {
    const w = x1 - x0;
    for (const [y, h, c] of SKY) add(x0, y, w, h, c);
    add(x0, 72, w, 12, "#3a4a7a");
    for (let i = 0; i < 7; i++) add(x0 + ((i * 23 + Math.floor(f / 24) * 2) % (w - 6)), 74 + ((i * 3) % 9), 5, 1, "#f0b27a", 0.45);
    for (let i = 0; i < 70; i++) {
      const bw = 6 + Math.floor(hash(i) * 8);
      const bh = 5 + Math.floor(hash(i + 50) * 13);
      const bx = i * 11 - 80 + Math.round(camX * 0.6);
      if (bx < x0 || bx + bw > x1) continue;
      add(bx, 72 - bh, bw, bh, "#262d50");
      if (i % 13 === 5) add(bx + 2, 64 - bh, 2, 8, "#262d50");
      if (hash(i + 9) > 0.45) add(bx + 2, 74 - bh, 1, 1, AMBER);
      if (hash(i + 3) > 0.6) add(bx + 4, 77 - bh, 1, 1, AMBER);
    }
  }
  const wall = "#353b5a";
  add(0, 0, WORLD, 22, wall);
  add(0, 84, WORLD, 24, wall);
  add(0, 22, 8, 62, wall);
  add(128, 22, 190, 62, wall);
  add(462, 22, 98, 62, wall);
  for (const [x0, x1] of WINDOWS) {
    for (let x = x0 + 39; x < x1 - 4; x += 40) add(x, 22, 2, 62, DARK);
    add(x0 - 1, 21, x1 - x0 + 2, 1, DARK);
    add(x0 - 2, 84, x1 - x0 + 4, 2, "#4a5070");
  }
  add(0, 0, WORLD, 14, "#1a2036");
  add(0, 108, WORLD, 4, DARK);
  add(0, FLOOR, WORLD, 68, "#2a3048");
  for (let row = 0; row < 12; row++) for (let col = row % 2; col < 28; col += 2) add(col * 20, FLOOR + row * 6, 20, 6, "#2f3654");
  add(0, FLOOR, WORLD, 1, "#414a70");

  POSTERS.forEach((c, i) => {
    const x = 196 + (i % 3) * 17;
    const y = 26 + Math.floor(i / 3) * 19;
    add(x - 1, y - 1, 16, 18, DARK);
    add(x, y, 14, 16, c);
    const ink = i === 0 ? "#3d5fa0" : CREAM;
    if (i % 3 === 2) {
      add(x + 4, y + 5, 6, 6, ink);
      add(x + 6, y + 7, 2, 2, c);
    } else for (let k = 0; k < 3; k++) add(x + 3 + k * 3, y + 11 - k * 3, 2, 2 + k * 3, ink);
  });
  add(146, 28, 11, 11, INK);
  add(147, 29, 9, 9, CREAM);
  add(151, 31, 1, 3, INK);
  add(151, 33, 3, 1, INK);
  const tick = [[151, 30], [155, 33], [151, 37], [148, 33]][Math.floor(f / 30) % 4];
  add(tick[0], tick[1], 1, 1, "#d65f56");

  add(258, 44, 38, 64, DARK);
  for (let shelf = 0; shelf < 4; shelf++) {
    add(260, 46 + shelf * 15, 34, 13, "#262d4a");
    for (let k = 0; k < 11; k++) {
      const short = hash(shelf * 20 + k) > 0.75 ? 3 : 0;
      if (hash(shelf * 31 + k) > 0.15) add(261 + k * 3, 47 + shelf * 15 + short, 2, 12 - short, BINDERS[Math.floor(hash(shelf * 7 + k) * 5)]);
    }
  }

  add(18, 97, 34, 15, "#3a4058");
  add(34, 98, 1, 14, "#2a3048");
  add(17, 95, 36, 2, "#b9853f");
  add(22, 81, 11, 14, "#15171f");
  add(24, 84, 7, 3, "#2a2e3c");
  add(31, 82, 1, 1, Math.floor(f / 20) % 2 ? "#d65f56" : "#5a2a2a");
  add(25, 90, 5, 5, "#5a3a22");
  for (const x of [37, 41, 45]) add(x, 91, 3, 4, "#f2efe6");
  for (let k = 0; k < 3; k++) add(26 + ((k + Math.floor(f / 12)) % 3), 88 - ((Math.floor(f / 5) + k * 4) % 10), 1, 1, "#fff", 0.45);

  add(482, 34, 52, 36, DARK);
  add(483, 35, 50, 34, "#e9edf2");
  for (const [x, y, c] of [[487, 39, AMBER], [493, 39, "#e58fb0"], [487, 46, TEAL], [499, 41, AMBER], [493, 47, "#e58fb0"]] as const) add(x, y, 4, 4, c);
  for (let k = 0; k < 6; k++) add(508 + k * 4, 60 - k * 3 + (k % 2) * 2, 4, 1, "#d65f56");
  add(488, 98, 44, 2, "#b9853f");
  add(490, 100, 2, 12, DARK);
  add(528, 100, 2, 12, DARK);
  for (const x of [479, 536]) {
    add(x, 92, 6, 8, "#d9a03a");
    add(x, 100, 6, 2, "#b07f2a");
    add(x + 2, 102, 2, 10, DARK);
  }
  add(468, 22, 2, 90, "#8fb7c4", 0.5);
  add(470, 22, 90, 86, "#8fb7c4", 0.06);

  for (const [x, pot] of [[114, "#c9703f"], [234, CREAM], [330, "#c9703f"], [474, CREAM], [548, "#c9703f"]] as const) plant(r, x, pot);

  for (const x of [60, 160, 250, 340, 430, 520]) {
    add(x, 14, 1, 14, INK);
    add(x - 4, 28, 9, 4, AMBER);
    add(x - 3, 32, 7, 1, "#fff3c4");
    add(x - 10, 33, 21, 79, AMBER, 0.05);
    add(x - 5, 33, 11, 79, AMBER, 0.05);
    add(x - 12, FLOOR + 1, 25, 5, AMBER, 0.07);
  }

  for (const [who, s] of Object.entries(stations)) desk(r, s, who, f);
  return r;
}

// Big dark leaves nearer the lens: they slide faster than the room.
export function foreground(camX: number): Rect[] {
  const r: Rect[] = [];
  for (const wx of [118, 310, 520]) {
    const x = Math.round(wx - camX * 0.3);
    for (const [dx, y, w, h] of [[0, 104, 4, 30], [-6, 110, 5, 24], [5, 99, 4, 34], [10, 112, 6, 20], [-11, 117, 5, 16], [15, 119, 4, 12]]) r.push([x + dx, y, w, h, dx % 2 ? "#1d4a34" : "#173a2a"]);
  }
  return r;
}
