import { create } from "zustand";
import { BLACKJACK } from "../content";

export interface Card {
  rank: string;
  suit: string;
  value: number;
}

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];

function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    RANKS.forEach((rank, i) => {
      deck.push({ rank, suit, value: rank === "A" ? 11 : Math.min(i + 1, 10) });
    });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function handValue(hand: Card[]): number {
  let total = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];

export type BJPhase = "idle" | "player" | "done";

interface BJState {
  deck: Card[];
  player: Card[];
  duck: Card[];
  phase: BJPhase;
  smokes: number;
  line: string;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  borrow: () => void;
  reset: () => void;
}

const OPENING = "the duck shuffles without looking at the cards.";

export const useBlackjack = create<BJState>((set, get) => {
  const settle = (player: Card[], duck: Card[]) => {
    const pv = handValue(player);
    const kv = handValue(duck);
    if (pv > 21) {
      set((s) => ({ smokes: s.smokes - 1, line: BLACKJACK.bust, phase: "done" }));
    } else if (kv > 21 || pv > kv) {
      set((s) => ({ smokes: s.smokes + 1, line: pick(BLACKJACK.win), phase: "done" }));
    } else if (pv === kv) {
      set({ line: pick(BLACKJACK.push), phase: "done" });
    } else {
      set((s) => ({ smokes: s.smokes - 1, line: pick(BLACKJACK.lose), phase: "done" }));
    }
  };

  return {
    deck: [],
    player: [],
    duck: [],
    phase: "idle",
    smokes: 5,
    line: OPENING,

    deal: () => {
      const d = freshDeck();
      const player = [d.pop()!, d.pop()!];
      const duck = [d.pop()!, d.pop()!];
      if (handValue(player) === 21) {
        set((s) => ({ deck: d, player, duck, smokes: s.smokes + 2, line: BLACKJACK.blackjack, phase: "done" }));
      } else {
        set({ deck: d, player, duck, line: "hit or stand. the smoke waits for no one.", phase: "player" });
      }
    },

    hit: () => {
      const { deck, player, duck } = get();
      const d = [...deck];
      const p = [...player, d.pop()!];
      set({ deck: d, player: p });
      if (handValue(p) > 21) settle(p, duck);
    },

    stand: () => {
      const { deck, player, duck } = get();
      const d = [...deck];
      const k = [...duck];
      while (handValue(k) < 17) k.push(d.pop()!);
      set({ deck: d, duck: k });
      settle(player, k);
    },

    borrow: () => set({ smokes: 5, line: "a fresh pack appears. don't ask where from." }),

    reset: () => set({ deck: [], player: [], duck: [], phase: "idle", smokes: 5, line: OPENING }),
  };
});
