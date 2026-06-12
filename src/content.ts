export type StationId = "about" | "projects" | "stack" | "contact" | "stats" | "den";

export interface Station {
  id: StationId;
  label: string;
  // world position the player walks to, and trigger radius
  x: number;
  z: number;
  radius: number;
  duckLine: string;
  // hidden stations are off the duck's tour and the text fallback — find them yourself
  hidden?: boolean;
}

export const STATIONS: Station[] = [
  {
    id: "about",
    label: "ABOUT",
    x: -8.4,
    z: -5.0,
    radius: 3.0,
    duckLine: "that's the board. it's about him. allegedly.",
  },
  {
    id: "projects",
    label: "PROJECTS",
    x: 6.4,
    z: -7.4,
    radius: 3.4,
    duckLine: "the screens. everything he ships, straight from github. some of it even works.",
  },
  {
    id: "stack",
    label: "STACK",
    x: 9.4,
    z: 2.6,
    radius: 2.8,
    duckLine: "the machine sells languages. he uses all of them. commitment issues.",
  },
  {
    id: "contact",
    label: "CONTACT",
    x: -9.0,
    z: 4.6,
    radius: 2.8,
    duckLine: "the phone works. sometimes. leave a message.",
  },
  {
    id: "stats",
    label: "SIGNAL",
    x: -8.8,
    z: -0.5,
    radius: 2.6,
    duckLine: "numbers. people like numbers.",
  },
  {
    id: "den",
    label: "???",
    x: -10.2,
    z: 8.4,
    radius: 2.0,
    duckLine: "oh. you found the den. nobody finds the den. ...deal you in?",
    hidden: true,
  },
];

export const IDENTITY = {
  name: "jax",
  handle: "@muxover",
  vibe: "developer · explorer · builds random cool shit",
};

export const ABOUT_COPY = [
  "been building since 2019.",
  "mostly full-stack and backend infrastructure — the kind of plumbing nobody notices until it breaks.",
  "i'll mess with anything that looks interesting at 3am. half these projects exist because i got curious and didn't stop.",
  "(somewhere in here i'm also a med student. don't ask.)",
];

export const STACK = ["Go", "Rust", "Python", "TypeScript", "JavaScript", "C++", ".NET", "PHP"];

export const CONTACT = [
  { label: "site", value: "muxover.is-a.dev", href: "https://muxover.is-a.dev" },
  { label: "email", value: "muxover@jax-development.com", href: "mailto:muxover@jax-development.com" },
  { label: "telegram", value: "t.me/muxover", href: "https://t.me/muxover" },
  { label: "instagram", value: "instagram.com/muxover", href: "https://instagram.com/muxover" },
  { label: "github", value: "github.com/muxover", href: "https://github.com/muxover" },
];

export const DUCK = {
  greetings: [
    "oh. a visitor. been a while.",
    "you found the place. nobody finds the place.",
  ],
  greeting3am: "3am. of course you're here at 3am. you'll fit right in.",
  follow: "follow me. or don't. the signs explain themselves.",
  idle: [
    "...",
    "got a light?",
    "the fog never lifts. you get used to it.",
    "he's around here somewhere. probably building something.",
  ],
  allDone: "that's everything. you can stay. the lamp's warm.",
  quacks: [
    "quack.",
    "don't.",
    "he's busy. i'm busy. we're all busy.",
    "*exhales slowly*",
    "you done?",
  ],
  quacksFinal: "ok. you win. quack quack quack. happy?",
  trash: [
    "old prototypes. still warm.",
    "a README in there. unread, naturally.",
    "energy drink cans. all the way down.",
    "don't dig too deep. some bugs were buried for a reason.",
  ],
  chaosOn: "cheat codes? in this economy? fine. enjoy the wobble.",
  chaosOff: "ok. reality restored. mostly.",
  stare: [
    "...you've been standing there a while.",
    "you good?",
    "blink twice if the fog got you.",
  ],
  complete: "huh. you actually looked at everything. even the den. ...respect.",
};

// shown in the tab title when the visitor wanders off to another tab
export const AWAY_TITLES = [
  "the duck is waiting.",
  "come back. the fog misses you.",
  "quack?",
];

export const BLACKJACK = {
  win: ["fine. take them.", "beginner's luck.", "...this deck is rigged."],
  lose: ["the house always quacks.", "thanks for the smokes.", "predictable."],
  push: ["nobody wins. like life."],
  blackjack: "a natural. unbelievable. take your smokes.",
  bust: "bust. the street is unforgiving.",
  broke: "you're out of smokes. the street thanks you for your donation.",
};
