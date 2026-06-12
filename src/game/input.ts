// Mutable input state shared between keyboard, joystick and the player
// system — deliberately outside React to avoid per-frame re-renders.

export const input = {
  forward: 0, // -1..1
  turn: 0, // -1..1
  joyForward: 0,
  joyTurn: 0,
  dragTurn: 0, // accumulated pointer-drag yaw, consumed each frame
};

export const playerState = {
  x: 0,
  z: 8.2,
  yaw: 0, // 0 faces -z
};

// the duck wanders; Duck.tsx keeps this current so proximity checks can find it
export const duckState = {
  x: 1.3,
  z: 0.7,
};

// last time the player actually moved or turned — the duck gets curious
// about visitors who stand still too long
export const activity = { t: 0 };

const keys = new Set<string>();

function recompute() {
  const f = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const t = (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) - (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0);
  input.forward = f;
  input.turn = t;
}

export function bindKeyboard(onInteract: () => void, onClose: () => void) {
  const down = (e: KeyboardEvent) => {
    if (e.code === "KeyE" || e.code === "Enter") onInteract();
    if (e.code === "Escape") onClose();
    keys.add(e.code);
    recompute();
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code);
    recompute();
  };
  const blur = () => {
    keys.clear();
    recompute();
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}
