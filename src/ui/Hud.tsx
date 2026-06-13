import { useEffect, useState } from "react";
import { STATIONS, IDENTITY } from "../content";
import { useStore } from "../store";

export function Hud() {
  const prompt = useStore((s) => s.prompt);
  const panel = useStore((s) => s.panel);
  const dialogue = useStore((s) => s.dialogue);
  const touch = useStore((s) => s.touch);
  const setTextMode = useStore((s) => s.setTextMode);
  const interact = useStore((s) => s.interact);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(id);
  }, []);

  const label =
    prompt === "duck"
      ? "BOTHER THE DUCK"
      : prompt === "trash"
        ? "DIG"
        : prompt === "bench"
          ? "SIT"
          : STATIONS.find((s) => s.id === prompt)?.label ?? null;

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-id">
          <span className="hud-handle">{IDENTITY.handle}</span>
          <span className="hud-vibe">{IDENTITY.vibe}</span>
        </div>
        <button className="hud-skip" onClick={() => setTextMode(true)}>
          just show me the info
        </button>
      </div>

      {hint && !panel && (
        <div className="hud-hint">{touch ? "joystick to move · tap LOOK at the signs" : "W/S walk · A/D turn · E look"}</div>
      )}

      {dialogue && !panel && (
        <div className="hud-dialogue">
          <span className="hud-duck">duck</span> {dialogue}
        </div>
      )}

      {label && !panel && (
        <div className="hud-prompt">
          {touch ? (
            <button className="hud-look" onClick={interact}>
              {label}
            </button>
          ) : (
            <>[E] {label}</>
          )}
        </div>
      )}
    </div>
  );
}
