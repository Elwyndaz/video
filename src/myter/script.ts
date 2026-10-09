// All text in the film. Edit here, then `npm run render`.
// Every verdict restates a claim on orgutveckling.se/forskning, worded no stronger than it is there. Check the live page, not a local copy:
// MBTI, power pose, brainstorming and Maslow are level 3 (tested, does not hold), sju procent is level 2, lärstilar level 4 (not known).

export type Who = "liv" | "nadja" | "goran" | "mira";

export const names: Record<Who, string> = { liv: "LIV", nadja: "NADJA", goran: "GÖRAN", mira: "MIRA" };

export interface Beat {
  attack: string;
  line: string;
  reply: [who: Exclude<Who, "nadja">, line: string];
  verdict: string;
}

export const intro = "Nadja har varit på ledarskapskonferens.";

export const beats: Beat[] = [
  {
    attack: "MBTI",
    line: "Hej hej! Konsulten har testat hela ledningsgruppen. Jag är en ENFP!",
    reply: ["liv", "I våras var du INTJ."],
    verdict: "Typen byts ofta när samma person gör om testet.",
  },
  {
    attack: "LÄRSTILAR",
    line: "Göran, du är visuell inlärare. Jag har ritat ditt lönesamtal.",
    reply: ["goran", "Rita en högre siffra då."],
    verdict: "Det är inte visat att anpassning efter lärstil hjälper.",
  },
  {
    attack: "SJU PROCENT",
    line: "Orden är bara 7 procent av budskapet. Resten är kroppsspråk!",
    reply: ["mira", "Då läser jag 7 procent av ditt nyhetsbrev."],
    verdict: "Forskaren bakom siffrorna säger själv att de inte gäller så.",
  },
  {
    attack: "POWER POSE",
    line: "Power pose före mötet! Det höjer testosteronet.",
    reply: ["liv", "Mötet är på Teams."],
    verdict: "Höjer inte testosteronet. Fyndet gick inte att upprepa.",
  },
  {
    attack: "BRAINSTORM",
    line: "Alla in i glasburen. Det finns inga dåliga idéer!",
    reply: ["goran", "Jag har en bra. Vi tänker var för sig."],
    verdict: "Ger färre och sämre idéer än att tänka var för sig.",
  },
];

export const outro = {
  line: "Okej. Men Maslows behovstrappa då?",
  reply: "Nej.",
  card: ["230 påståenden om arbetsliv, ledarskap och organisation.", "Sorterade efter vad forskningen bär."],
  url: "orgutveckling.se/forskning",
  sender: "Centrum för Organisationsutveckling",
};
