import { create } from "zustand";
import type { Profile, Repo, DataStatus } from "./api/github";
import { DUCK, type StationId } from "./content";

// world prompts that aren't stations — they just make the duck talk
export type PromptId = StationId | "duck" | "trash";

interface AppState {
  phase: "loading" | "play";
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
  toggleChaos: () => void;
  say: (text: string, ms?: number) => void;
  setData: (d: { profile: Profile | null; repos: Repo[]; status: DataStatus }) => void;
}

let sayTimer: ReturnType<typeof setTimeout> | undefined;
let bothered = 0;
let dug = 0;

export const useStore = create<AppState>((set, get) => ({
  phase: "loading",
  textMode: typeof location !== "undefined" && new URLSearchParams(location.search).has("text"),
  panel: null,
  prompt: null,
  visited: {},
  dialogue: null,
  profile: null,
  repos: [],
  dataStatus: "loading",
  reduced: typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  touch:
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches)),
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
    } else {
      s.openPanel(s.prompt);
    }
  },
  toggleChaos: () => {
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
