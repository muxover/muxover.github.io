import { BLACKJACK } from "../content";
import { useBlackjack, handValue } from "../game/blackjack";
import { useStore } from "../store";

export function DenHud() {
  const { player, duck, phase, smokes, line, deal, hit, stand, borrow } = useBlackjack();
  const exitDen = useStore((s) => s.exitDen);
  const prompt = useStore((s) => s.prompt);
  const touch = useStore((s) => s.touch);

  const broke = smokes <= 0 && phase !== "player";
  const started = player.length > 0;

  return (
    <div className="hud">
      <div className="den-top">
        <span className="den-title">:: THE DEN — blackjack</span>
        <button className="hud-skip" onClick={exitDen}>
          leave
        </button>
      </div>

      {/* live hand totals mirror the cards on the felt */}
      {started && (
        <div className="den-scores">
          <span>
            <span className="dim">duck</span> {phase === "player" ? "?" : <b>{handValue(duck)}</b>}
          </span>
          <span>
            <span className="dim">you</span> <b>{handValue(player)}</b>
          </span>
        </div>
      )}

      <div className="den-panel">
        <div className="den-smokes">
          smokes {"▮".repeat(Math.max(0, smokes))}
          {smokes <= 0 && " (none)"}
        </div>
        <p className="den-line">
          <span className="hud-duck">duck</span> {broke ? BLACKJACK.broke : line}
        </p>
        <div className="den-actions">
          {phase === "player" ? (
            <>
              <button onClick={hit}>HIT</button>
              <button onClick={stand}>STAND</button>
            </>
          ) : broke ? (
            <button onClick={borrow}>BORROW 5 SMOKES</button>
          ) : (
            <button onClick={deal}>{started ? "DEAL AGAIN" : "DEAL"}</button>
          )}
        </div>
        <p className="den-hint dim">
          {prompt === "leave"
            ? touch
              ? "tap leave to step out"
              : "[E] leave through the door"
            : "the door's behind you when you're done"}
        </p>
      </div>
    </div>
  );
}
