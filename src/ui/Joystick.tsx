import { useRef } from "react";
import { input } from "../game/input";

const RADIUS = 52;

export function Joystick() {
  const knob = useRef<HTMLDivElement>(null!);
  const active = useRef<number | null>(null);

  const move = (e: React.PointerEvent, base: DOMRect) => {
    let dx = e.clientX - (base.left + base.width / 2);
    let dy = e.clientY - (base.top + base.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    input.joyTurn = -dx / RADIUS;
    input.joyForward = -dy / RADIUS;
  };

  const reset = () => {
    active.current = null;
    knob.current.style.transform = "translate(0, 0)";
    input.joyTurn = 0;
    input.joyForward = 0;
  };

  return (
    <div
      className="joystick"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e, e.currentTarget.getBoundingClientRect());
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) move(e, e.currentTarget.getBoundingClientRect());
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
    >
      <div className="joystick-knob" ref={knob} />
    </div>
  );
}
