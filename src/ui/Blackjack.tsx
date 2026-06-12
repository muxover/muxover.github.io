import { useState } from "react";
import { BLACKJACK } from "../content";

interface Card {
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

function handValue(hand: Card[]): number {
  let total = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function pick(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}

type Phase = "idle" | "player" | "done";

export function Blackjack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [duck, setDuck] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [smokes, setSmokes] = useState(5);
  const [line, setLine] = useState("the duck shuffles without looking at the cards.");

  const deal = () => {
    const d = freshDeck();
    const p = [d.pop()!, d.pop()!];
    const k = [d.pop()!, d.pop()!];
    setDeck(d);
    setPlayer(p);
    setDuck(k);
    if (handValue(p) === 21) {
      setSmokes((s) => s + 2);
      setLine(BLACKJACK.blackjack);
      setPhase("done");
    } else {
      setLine("hit or stand. the smoke waits for no one.");
      setPhase("player");
    }
  };

  const settle = (p: Card[], k: Card[]) => {
    const pv = handValue(p);
    const kv = handValue(k);
    if (pv > 21) {
      setSmokes((s) => s - 1);
      setLine(BLACKJACK.bust);
    } else if (kv > 21 || pv > kv) {
      setSmokes((s) => s + 1);
      setLine(pick(BLACKJACK.win));
    } else if (pv === kv) {
      setLine(pick(BLACKJACK.push));
    } else {
      setSmokes((s) => s - 1);
      setLine(pick(BLACKJACK.lose));
    }
    setPhase("done");
  };

  const hit = () => {
    const d = [...deck];
    const p = [...player, d.pop()!];
    setDeck(d);
    setPlayer(p);
    if (handValue(p) > 21) settle(p, duck);
  };

  const stand = () => {
    const d = [...deck];
    const k = [...duck];
    while (handValue(k) < 17) k.push(d.pop()!);
    setDeck(d);
    setDuck(k);
    settle(player, k);
  };

  const broke = smokes <= 0 && phase !== "player";

  const Hand = ({ cards, hideHole }: { cards: Card[]; hideHole?: boolean }) => (
    <div className="bj-hand">
      {cards.map((c, i) =>
        hideHole && i === 1 ? (
          <span key={i} className="bj-card bj-back">
            ?
          </span>
        ) : (
          <span key={i} className={`bj-card ${c.suit === "♥" || c.suit === "♦" ? "bj-red" : ""}`}>
            {c.rank}
            {c.suit}
          </span>
        ),
      )}
    </div>
  );

  return (
    <div className="bj">
      <p className="dim">stakes: one cigarette a hand. the duck plays house rules.</p>
      <div className="bj-smokes">smokes: {"▮".repeat(Math.max(0, smokes))} {smokes <= 0 && "(none)"}</div>

      {player.length > 0 && (
        <div className="bj-table">
          <div>
            <span className="dim">duck</span> {phase !== "player" && <b>{handValue(duck)}</b>}
            <Hand cards={duck} hideHole={phase === "player"} />
          </div>
          <div>
            <span className="dim">you</span> <b>{handValue(player)}</b>
            <Hand cards={player} />
          </div>
        </div>
      )}

      <p className="bj-line">
        <span className="hud-duck">duck</span> {broke ? BLACKJACK.broke : line}
      </p>

      <div className="bj-actions">
        {phase === "player" ? (
          <>
            <button onClick={hit}>HIT</button>
            <button onClick={stand}>STAND</button>
          </>
        ) : broke ? (
          <button
            onClick={() => {
              setSmokes(5);
              setLine("a fresh pack appears. don't ask where from.");
            }}
          >
            BORROW 5 SMOKES
          </button>
        ) : (
          <button onClick={deal}>{player.length ? "DEAL AGAIN" : "DEAL"}</button>
        )}
      </div>
    </div>
  );
}
