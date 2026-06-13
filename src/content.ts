export type StationId =
  | "about"
  | "opensource"
  | "services"
  | "clientwork"
  | "stack"
  | "contact"
  | "stats"
  | "den";

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
    duckLine: "that's the board. it's about him. mostly true.",
  },
  {
    id: "opensource",
    label: "OPEN SOURCE",
    x: 6.4,
    z: -7.4,
    radius: 3.4,
    duckLine: "the screens. everything he ships in the open, straight off github. some of it even works.",
  },
  {
    id: "services",
    label: "SERVICES",
    x: 9.8,
    z: -4.2,
    radius: 2.8,
    duckLine: "the counter. turns out he builds for money too. want in? there's a phone for that.",
  },
  {
    id: "clientwork",
    label: "CLIENT WORK",
    x: -5.5,
    z: -8.2,
    radius: 2.8,
    duckLine: "he doesn't talk about what he builds for other people. want the real story? there's a phone. use it.",
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
    duckLine: "the phone still works. mostly. leave a message, he reads them at 4am.",
  },
  {
    id: "stats",
    label: "SIGNAL",
    x: -8.8,
    z: -0.5,
    radius: 2.6,
    duckLine: "numbers off the wire. people like numbers. i prefer cigarettes.",
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
  name: "Jax",
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

export interface Service {
  name: string;
  desc: string;
}

export const SERVICES: Service[] = [
  { name: "Custom Development", desc: "full-stack apps and backend infrastructure, built to spec." },
  { name: "SSL Bypass — iOS & Android", desc: "certificate pinning bypass for mobile testing and research." },
  { name: "Go Obfuscation & Protection", desc: "harden Go binaries against reverse engineering." },
];

// the in-world boards speak in Jax's first person ("I"); the duck narrates in
// third person ("he"). on the street the phone is a real place to walk to; on
// the flat info page it isn't, so the wording differs.
export const SERVICES_CTA = {
  street: "want something built? the payphone's on the street — give me a ring.",
  page: "want something built? my contacts are below.",
};

export const CLIENTWORK_COPY = {
  body: "i keep client work private — reach out for testimonials and a look at what i've built.",
  street: "the payphone's on the street. ring me.",
  page: "my contacts are below.",
};

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
    "huh. real one. thought you were the fog again.",
    "didn't hear you come in. nobody ever does.",
  ],
  greeting3am: "3am. of course you're here at 3am. you'll fit right in.",
  follow: [
    "come on. i'll show you around. try not to touch the puddles.",
    "this way. the signs do most of the talking anyway.",
    "follow the cigarette. i'll go slow.",
    "stick close. the fog eats people who wander.",
  ],
  idle: [
    "...",
    "got a light?",
    "the fog never lifts. you get used to it.",
    "he's around here somewhere. probably building something.",
    "quiet night. they're all quiet here.",
    "you can poke around. i'm not going anywhere.",
  ],
  ignored: [
    "fine. wander. i'll be at the lamp.",
    "suit yourself. it's all yours.",
    "take your time. i've got nothing but.",
  ],
  // player ditched the tour and started exploring solo
  gaveUp: [
    "oh, you're doing it yourself. cool. cool cool cool. i'll be at the lamp.",
    "right. nobody needs a guide. i'll just... be over here. smoking.",
    "off you go then. i'll keep the lamp warm.",
    "a self-guided type. respect. i'll be at the lamp if you get lost.",
  ],
  allDone: "that's the whole street. you can stay. the lamp's warm.",
  quacks: [
    "quack.",
    "don't.",
    "he's busy. i'm busy. we're all busy.",
    "*exhales slowly*",
    "poke me again. see what happens.",
    "you done?",
  ],
  quacksFinal: "ok. you win. quack quack quack. happy now?",
  trash: [
    "old prototypes. still warm.",
    "a README in there. unread, naturally.",
    "energy drink cans. all the way down.",
    "someone's TODO list. it just says 'sleep'.",
    "don't dig too deep. some bugs were buried for a reason.",
  ],
  bench: [
    "sit. the bench is cold. everything here is cold.",
    "he sits here when a build's running. just stares at the fog.",
    "good a spot as any to do nothing.",
    "careful, that slat's been loose since 2019.",
    "stay as long as you want. the street doesn't keep time.",
  ],
  benchFinal: "you really like this bench. i'll leave you two alone.",
  chaosOn: "cheat codes? in this economy? fine. enjoy the wobble.",
  chaosOff: "ok. reality restored. mostly.",
  chaosReduced: "nice try. reality's already holding still for you.",
  stare: [
    "...you've been standing there a while.",
    "you good? blink if you're in there.",
    "the fog get you? it does that.",
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
