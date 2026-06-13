import { create } from "zustand";
import type { Profile, Repo, DataStatus } from "./api/github";
import { CONFIG } from "./config";
import { playerState } from "./game/input";
import { useBlackjack } from "./game/blackjack";
import { DUCK, type StationId } from "./content";

// world prompts that aren't stations — they just make the duck talk
export type PromptId = StationId | "duck" | "trash" | "bench" | "leave";
export type Scene = "street" | "den";

interface AppState {
  phase: "loading" | "play";
  scene: Scene;
  textMode: boolean;
  panel: StationId | null;
  prompt: PromptId | null;
  visited: Partial<Record<StationId, boolean>>;
  dialogue: string | null;
  profile: Profile | null;
  repos: Repo[];
  dataStatus: DataStatus | "loading";
  reduced: boolean;
  touch: boolean;
  chaos: boolean;

  setPhase: (p: "loading" | "play") => void;
  setTextMode: (v: boolean) => void;
  openPanel: (id: StationId) => void;
  closePanel: () => void;
  setPrompt: (id: PromptId | null) => void;
  interact: () => void;
  enterDen: () => void;
  exitDen: () => void;
  toggleChaos: () => void;
  say: (text: string, ms?: number) => void;
  setData: (d: { profile: Profile | null; repos: Repo[]; status: DataStatus }) => void;
}

let sayTimer: ReturnType<typeof setTimeout> | undefined;
let bothered = 0;
let dug = 0;
let sat = 0;

const isTouch =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches));
const wantsText = typeof location !== "undefined" && new URLSearchParams(location.search).has("text");
const wantsGame = typeof location !== "undefined" && new URLSearchParams(location.search).has("street");

export const useStore = create<AppState>((set, get) => ({
  phase: "loading",
  scene: "street",
  // mobile gets the clean info page by default — the 3D street is a desktop thing
  textMode: wantsText || (isTouch && !wantsGame),
  panel: null,
  prompt: null,
  visited: {},
  dialogue: null,
  profile: null,
  repos: [],
  dataStatus: "loading",
  reduced: typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  touch: isTouch,
  chaos: false,

  setPhase: (phase) => set({ phase }),
  setTextMode: (textMode) => set({ textMode, panel: null }),
  openPanel: (id) => set((s) => ({ panel: id, visited: { ...s.visited, [id]: true } })),
  closePanel: () => set({ panel: null }),
  setPrompt: (prompt) => set((s) => (s.prompt === prompt ? s : { prompt })),
  interact: () => {
    const s = get();
    if (s.panel || !s.prompt) return;
    if (s.prompt === "duck") {
      bothered++;
      s.say(bothered > DUCK.quacks.length ? DUCK.quacksFinal : DUCK.quacks[Math.min(bothered - 1, DUCK.quacks.length - 1)]);
    } else if (s.prompt === "trash") {
      s.say(DUCK.trash[dug++ % DUCK.trash.length]);
    } else if (s.prompt === "bench") {
      sat++;
      s.say(sat > DUCK.bench.length ? DUCK.benchFinal : DUCK.bench[Math.min(sat - 1, DUCK.bench.length - 1)]);
    } else if (s.prompt === "den") {
      s.enterDen();
    } else if (s.prompt === "leave") {
      s.exitDen();
    } else {
      s.openPanel(s.prompt);
    }
  },
  enterDen: () => {
    const [x, z] = CONFIG.den.spawn;
    playerState.x = x;
    playerState.z = z;
    playerState.yaw = 0;
    useBlackjack.getState().reset();
    set((st) => ({ scene: "den", prompt: null, panel: null, dialogue: null, visited: { ...st.visited, den: true } }));
  },
  exitDen: () => {
    const [x, z] = CONFIG.den.exitPos;
    playerState.x = x;
    playerState.z = z;
    playerState.yaw = CONFIG.den.exitYaw;
    set({ scene: "street", prompt: null, dialogue: null });
  },
  toggleChaos: () => {
    // honor prefers-reduced-motion: no wobble/grain assault for those users
    if (get().reduced) {
      get().say(DUCK.chaosReduced);
      return;
    }
    const chaos = !get().chaos;
    set({ chaos });
    get().say(chaos ? DUCK.chaosOn : DUCK.chaosOff);
  },
  say: (text, ms = 4200) => {
    clearTimeout(sayTimer);
    set({ dialogue: text });
    sayTimer = setTimeout(() => set({ dialogue: null }), ms);
  },
  setData: ({ profile, repos, status }) => set({ profile, repos, dataStatus: status }),
}));
