import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/PixelifySans";
import { HOME, WORLD, foreground, office, person, stations, type Pose, type Rect } from "./art";
import { beats, intro, names, outro, type Who } from "./script";

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });

// Palette from the game Kontoret, where the characters come from.
const INK = "#111522";
const PANEL = "#142d4a";
const CREAM = "#f2e7c7";
const AMBER = "#f2b94b";
const TEAL = "#69d2c7";
const RUST = "#d65f56";

// One bar of the score (scripts/myter-audio.mjs) is 48 frames. Everything cuts on it.
const BAR = 48;
const INTRO = 3 * BAR;
const BEAT = 8 * BAR;
const OUTRO = INTRO + beats.length * BEAT;
export const TOTAL = OUTRO + 8 * BAR;
// Inside one myth: Nadja walks over, says her line, attacks, gets a reply, and the stamp lands in the hole in the music.
// The verdict then stays up alone, into the next walk. Nothing else types while it is readable.
const ARRIVE = 40;
const LINE = 44;
const ATTACK = 168;
const REPLY = 212;
const STAMP = 6 * BAR;
const VERDICT = STAMP + 12;
const LINGER = ARRIVE;
const OUTRO_STAMP = 3 * BAR;
const CHARS_PER_FRAME = 2;
const typing = (s: string) => Math.ceil(s.length / CHARS_PER_FRAME);

// The picture (art.ts) is drawn on a logical grid. The camera shows a 135 px square of it, eight screen pixels to one,
// starting at row TOP so the floor sits just above the dialogue box.
const VIEW = 135;
const TOP = 26;

type Colleague = Exclude<Who, "nadja">;
const PARTNERS: Colleague[] = [...beats.map((b) => b.reply[0]), "liv"];
const startOf = (k: number) => (k < beats.length ? INTRO + k * BEAT : OUTRO);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const hold = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = { ...hold, easing: Easing.inOut(Easing.cubic) } as const;

// One walk per myth plus one for the outro. Nadja stops 24 px left of the colleague's chair.
// Each walk ends ARRIVE frames into its myth and starts as early as the distance needs at 2,4 px per frame.
const legs = PARTNERS.map((partner, k) => {
  const from = k === 0 ? HOME : stations[PARTNERS[k - 1]] - 24;
  const to = stations[partner] - 24;
  return { from, to, end: startOf(k) + ARRIVE, dur: Math.max(1, Math.round(Math.abs(to - from) / 2.4)) };
});

function nadjaAt(f: number): { x: number; dir: 1 | -1; walking: boolean } {
  const leg = legs.find((l) => f > l.end - l.dur && f < l.end);
  if (leg) return { x: Math.round(interpolate(f, [leg.end - leg.dur, leg.end], [leg.from, leg.to], ease)), dir: leg.to > leg.from ? 1 : -1, walking: true };
  const k = legs.filter((l) => f >= l.end).length - 1;
  return k < 0 ? { x: HOME, dir: -1, walking: false } : { x: legs[k].to, dir: 1, walking: false };
}

// Side-scroller camera: locked on Nadja, a little ahead so the desk she talks to is in frame.
function cameraAt(f: number): number {
  const follow = clamp(nadjaAt(f).x + 30 - VIEW / 2, 0, WORLD - VIEW);
  const pan = interpolate(f, [20, 130], [240, follow], ease);
  const centre = interpolate(f, [OUTRO + 190, OUTRO + 250], [0, 1], ease);
  return Math.round(pan + ((WORLD - VIEW) / 2 - pan) * centre);
}

const hits = [...beats.flatMap((_, i) => [INTRO + i * BEAT + ATTACK, INTRO + i * BEAT + STAMP]), OUTRO + OUTRO_STAMP];
function shake(f: number, phase: number): number {
  const d = hits.map((h) => f - h).find((d) => d >= 0 && d < 12);
  return d === undefined ? 0 : Math.round(2 * (1 - d / 12) * Math.sin(d * 2.4 + phase));
}

const text: CSSProperties = { fontFamily, fontVariantLigatures: "none", color: CREAM };
// Running text is a system sans, as in the game: the pixel face draws 5 as S and 2 as 8.
const body: CSSProperties = { fontFamily: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif', fontWeight: 600, color: CREAM };

const Rects = ({ list }: { list: Rect[] }) => (
  <>
    {list.map(([x, y, w, h, c, o], i) => (
      <rect key={i} x={x} y={y} width={w} height={h} fill={c} opacity={o} />
    ))}
  </>
);

const World = () => {
  const f = useCurrentFrame();
  const camX = cameraAt(f);
  const n = nadjaAt(f);
  const k = f < INTRO ? -1 : Math.min(Math.floor((f - INTRO) / BEAT), beats.length);
  const l = k < 0 ? -1 : f - startOf(k);
  const beat = k >= 0 && k < beats.length ? beats[k] : undefined;
  const line = beat ? beat.line : k === beats.length ? outro.line : "";

  const attacking = beat !== undefined && l >= ATTACK;
  const power = attacking && beat?.attack === "POWER POSE" && l < STAMP + 24;
  const casting = attacking && l < ATTACK + 30;
  const pose: Pose = n.walking ? "walk" : power ? "power" : casting ? "cast" : "stand";
  const lift = casting && l < ATTACK + 18 ? Math.round(6 * Math.sin((Math.PI * (l - ATTACK)) / 18)) : 0;

  const colleague = (who: Colleague) => {
    // Turns the chair towards Nadja once she has attacked, and back when she leaves.
    const mine = k >= 0 && PARTNERS[k] === who && !n.walking && l >= (beat ? ATTACK + 20 : LINE + 60);
    const talk = mine && beat !== undefined && l >= REPLY + 6 && l < REPLY + 6 + typing(beat.reply[1]);
    return <Rects key={who} list={person(who, { x: stations[who], dir: mine ? -1 : 1, pose: "sit", f, talk })} />;
  };

  return (
    <AbsoluteFill style={{ background: INK }}>
      <svg viewBox={`${camX + shake(f, 0)} ${TOP + shake(f, 1.3)} ${VIEW} ${VIEW}`} width={1080} height={1080} shapeRendering="crispEdges">
        <Rects list={office(f, camX)} />
        {colleague("liv")}
        {colleague("goran")}
        {colleague("mira")}
        <Rects list={person("nadja", { x: n.x, dir: n.dir, pose, f, step: Math.floor(f / 4), talk: l >= LINE + 6 && l < LINE + 6 + typing(line), lift })} />
        <Rects list={foreground(camX)} />
      </svg>
    </AbsoluteFill>
  );
};

const Typed = ({ children, from = 0 }: { children: string; from?: number }) => {
  const f = useCurrentFrame();
  const n = clamp(Math.floor((f - from) * CHARS_PER_FRAME), 0, children.length);
  // The untyped tail stays in the layout, invisible, so words do not jump lines mid-sentence.
  return (
    <>
      {children.slice(0, n)}
      <span style={{ opacity: 0 }}>{children.slice(n)}</span>
    </>
  );
};

const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ background: PANEL, border: `5px solid ${TEAL}`, boxShadow: `0 0 0 5px ${INK}, 10px 10px 0 5px rgba(0,0,0,.45)`, ...style }}>{children}</div>
);

const Dialogue = ({ who, children }: { who: Who; children: string }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: f, fps, config: { damping: 16 } });
  const done = 6 + typing(children);
  return (
    <AbsoluteFill>
      <Sequence from={6} durationInFrames={typing(children)} layout="none">
        <Audio src={staticFile(who === "nadja" ? "myter/talk-hi.wav" : "myter/talk-lo.wav")} volume={0.35} />
      </Sequence>
      <Panel style={{ position: "absolute", left: 29, right: 29, bottom: 29, height: 280, display: "flex", gap: 26, padding: 22, transform: `translateY(${(1 - rise) * 340}px)` }}>
        {/* The portrait is the same figure as in the room: its head, fourteen screen pixels to one. */}
        <svg viewBox="-8 79 16 16" width={220} height={220} shapeRendering="crispEdges" style={{ border: `5px solid ${AMBER}`, background: "#2f6fb5", flexShrink: 0 }}>
          <Rects list={person(who, { x: 0, dir: 1, pose: "stand", f, talk: f >= 6 && f < done })} />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ ...text, display: "inline-block", background: AMBER, color: INK, fontWeight: 700, fontSize: 34, padding: "0 16px", transform: "rotate(-1.5deg)" }}>{names[who]}</div>
          <div style={{ ...body, fontSize: 38, lineHeight: 1.25, marginTop: 14 }}>
            <Typed from={6}>{children}</Typed>
          </div>
        </div>
        {f > done + 10 && Math.floor(f / 10) % 2 === 0 ? (
          <div style={{ position: "absolute", right: 22, bottom: 16, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: `16px solid ${AMBER}` }} />
        ) : null}
      </Panel>
    </AbsoluteFill>
  );
};

const AttackBanner = ({ name }: { name: string }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 9, mass: 0.6 } });
  const out = interpolate(f, [36, 44], [1, 0], hold);
  return (
    <AbsoluteFill>
      <Audio src={staticFile("myter/attack.wav")} volume={0.6} />
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 7], [0.8, 0], hold) }} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + 0.2;
        const r = interpolate(f, [0, 22], [40, 330 + (i % 3) * 60], { ...hold, easing: Easing.out(Easing.cubic) });
        return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * r - 12, top: 230 + Math.sin(a) * r * 0.5 - 12, width: 24, height: 24, background: [AMBER, TEAL, CREAM][i % 3], opacity: interpolate(f, [8, 26], [1, 0], hold) }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", opacity: out, transform: `scale(${0.4 + pop * 0.6})` }}>
        <Panel style={{ display: "inline-block", padding: "14px 44px 22px", borderColor: AMBER }}>
          <div style={{ ...text, fontSize: 38 }}>NADJA använder</div>
          <div style={{ ...text, fontSize: 112, fontWeight: 700, lineHeight: 1, color: AMBER, textShadow: `7px 7px 0 ${INK}` }}>{name}!</div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

const Stamp = ({ duration }: { duration: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame: f, fps, config: { damping: 11, mass: 0.5, stiffness: 180 } });
  const opacity = Math.min(1, f / 3) * interpolate(f, [duration - 8, duration], [1, 0], hold);
  return (
    <AbsoluteFill>
      <Audio src={staticFile("myter/nope.wav")} volume={0.7} />
      <AbsoluteFill style={{ background: RUST, opacity: interpolate(f, [0, 8], [0.45, 0], hold) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center", transform: `rotate(-7deg) scale(${3 - slam * 2})`, opacity }}>
        <div style={{ ...text, display: "inline-block", fontSize: 92, fontWeight: 700, lineHeight: 1, color: RUST, background: "rgba(17,21,34,.88)", border: `10px solid ${RUST}`, padding: "10px 36px 18px", boxShadow: "12px 12px 0 rgba(0,0,0,.5)" }}>
          INGET STÖD
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Verdict = ({ children, duration }: { children: string; duration: number }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, duration - 10, duration], [0, 1, 1, 0], hold);
  return (
    <AbsoluteFill>
      <Audio src={staticFile("myter/ping.wav")} volume={0.5} />
      <div style={{ position: "absolute", left: 29, right: 29, top: 100, opacity: fade, transform: `translateY(${(1 - Math.min(1, f / 8)) * -30}px)` }}>
        <div style={{ background: CREAM, border: `5px solid ${INK}`, boxShadow: "8px 8px 0 rgba(0,0,0,.45)", padding: "12px 22px 18px" }}>
          <div style={{ ...text, color: "#1d6f68", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>FORSKNINGEN</div>
          <div style={{ ...body, color: INK, fontSize: 38, lineHeight: 1.2 }}>{children}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Hud = () => {
  const f = useCurrentFrame();
  const done = beats.filter((_, i) => f >= INTRO + i * BEAT + STAMP).length;
  const since = hits.filter((_, i) => i % 2 === 1 || i === hits.length - 1).map((h) => f - h).find((d) => d >= 0 && d < 40);
  const opacity = interpolate(f, [INTRO - 20, INTRO], [0, 1], hold);
  return (
    <div style={{ ...text, position: "absolute", left: 0, right: 0, top: 0, height: 78, opacity, background: "rgba(17,21,34,.9)", borderBottom: `5px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 29px", fontSize: 32, fontWeight: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ marginRight: 6 }}>MYTER</span>
        {beats.map((beat, i) => (
          <div key={beat.attack} style={{ width: 26, height: 26, border: `4px solid ${CREAM}`, background: i < done ? RUST : "transparent" }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        NADJAS ENTUSIASM
        <div style={{ width: 190, height: 26, border: `4px solid ${CREAM}`, background: since !== undefined && since < 6 ? "#fff" : AMBER }} />
        <span style={{ color: AMBER }}>100 %</span>
      </div>
      {since !== undefined ? <div style={{ position: "absolute", right: 40, top: 70 + since * 0.4, color: RUST, fontSize: 44, opacity: 1 - since / 40, textShadow: `4px 4px 0 ${INK}` }}>-0</div> : null}
    </div>
  );
};

const Title = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f - 4, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ background: INK, opacity: interpolate(f, [50, 68], [1, 0], hold), alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...text, fontSize: 150, fontWeight: 700, color: AMBER, textShadow: `10px 10px 0 ${PANEL}`, transform: `translateY(${(1 - drop) * -500}px)` }}>FEM MYTER</div>
      <div style={{ ...text, fontSize: 46, color: TEAL, letterSpacing: 6, opacity: f > 22 ? 1 : 0 }}>MÅNDAG MORGON</div>
    </AbsoluteFill>
  );
};

const Caption = ({ children }: { children: string }) => (
  <Panel style={{ position: "absolute", left: 29, right: 29, bottom: 29, padding: "26px 30px 32px" }}>
    <div style={{ ...body, fontSize: 40, lineHeight: 1.2 }}>
      <Typed from={4}>{children}</Typed>
    </div>
  </Panel>
);

const EndCard = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const show = (at: number) => ({ opacity: interpolate(f, [at, at + 10], [0, 1], hold), transform: `translateY(${interpolate(f, [at, at + 10], [24, 0], hold)}px)` });
  const pop = spring({ frame: f - 70, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: `rgba(17,21,34,${interpolate(f, [0, 30], [0, 0.86], hold)})`, alignItems: "center", justifyContent: "center", padding: 60, textAlign: "center" }}>
      <Sequence from={70} layout="none">
        <Audio src={staticFile("myter/win.wav")} volume={0.6} />
      </Sequence>
      <div style={{ ...body, fontSize: 58, fontWeight: 700, lineHeight: 1.15, ...show(20) }}>{outro.card[0]}</div>
      <div style={{ ...text, fontSize: 46, color: TEAL, marginTop: 28, ...show(45) }}>{outro.card[1]}</div>
      <div style={{ marginTop: 64, transform: `scale(${pop})` }}>
        <div style={{ ...text, display: "inline-flex", alignItems: "center", gap: 20, background: AMBER, color: INK, fontSize: 62, fontWeight: 700, padding: "14px 34px 20px", boxShadow: `10px 10px 0 ${PANEL}` }}>
          <div style={{ borderTop: "18px solid transparent", borderBottom: "18px solid transparent", borderLeft: `26px solid ${INK}`, opacity: Math.floor(f / 12) % 2 ? 0.25 : 1 }} />
          {outro.url}
        </div>
      </div>
      <div style={{ ...body, fontSize: 30, fontWeight: 500, marginTop: 44, color: "rgba(242,231,199,.8)", ...show(90) }}>{outro.sender}</div>
    </AbsoluteFill>
  );
};

export const Film = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Audio src={staticFile("myter/music.wav")} volume={0.5} />
    <World />

    {legs.map((leg) => (
      <Sequence key={leg.end} from={leg.end - leg.dur} durationInFrames={Math.min(leg.dur, 45)} layout="none">
        <Audio src={staticFile("myter/walk.wav")} volume={0.3} />
      </Sequence>
    ))}

    {beats.map((beat, i) => (
      <Sequence key={beat.attack} from={INTRO + i * BEAT} durationInFrames={BEAT + LINGER} layout="none">
        <Sequence from={LINE} durationInFrames={REPLY - LINE - 4}>
          <Dialogue who="nadja">{beat.line}</Dialogue>
        </Sequence>
        <Sequence from={REPLY} durationInFrames={BEAT - REPLY - 30}>
          <Dialogue who={beat.reply[0]}>{beat.reply[1]}</Dialogue>
        </Sequence>
        <Sequence from={ATTACK} durationInFrames={44}>
          <AttackBanner name={beat.attack} />
        </Sequence>
        <Sequence from={STAMP} durationInFrames={56}>
          <Stamp duration={56} />
        </Sequence>
        <Sequence from={VERDICT} durationInFrames={BEAT + LINGER - VERDICT}>
          <Verdict duration={BEAT + LINGER - VERDICT}>{beat.verdict}</Verdict>
        </Sequence>
      </Sequence>
    ))}

    <Sequence from={OUTRO + LINE} durationInFrames={80}>
      <Dialogue who="nadja">{outro.line}</Dialogue>
    </Sequence>
    <Sequence from={OUTRO + 126} durationInFrames={58}>
      <Dialogue who="liv">{outro.reply}</Dialogue>
    </Sequence>
    <Sequence from={OUTRO + OUTRO_STAMP} durationInFrames={40}>
      <Stamp duration={40} />
    </Sequence>

    <Hud />
    <Sequence from={68} durationInFrames={INTRO - 72}>
      <Caption>{intro}</Caption>
    </Sequence>
    <Sequence durationInFrames={70}>
      <Title />
    </Sequence>
    <Sequence from={OUTRO + 184}>
      <EndCard />
    </Sequence>

    {/* CRT finish: scanlines and a vignette over everything. */}
    <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 2px, transparent 2px 8px)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.5) 100%)", pointerEvents: "none" }} />
  </AbsoluteFill>
);
