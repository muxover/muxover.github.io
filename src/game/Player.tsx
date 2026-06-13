import { useFrame } from "@react-three/fiber";
import { CONFIG, COLLIDERS } from "../config";
import { activity, input, playerState } from "./input";
import { useStore } from "../store";

export function Player() {
  useFrame((state, rawDt) => {
    const s = useStore.getState();
    const dt = Math.min(rawDt, 0.1);
    const p = CONFIG.player;
    const frozen = s.phase !== "play" || s.panel !== null;

    // reading a panel counts as being present, not idling
    if (s.panel) activity.t = state.clock.elapsedTime;

    if (!frozen) {
      const turning = input.turn + input.joyTurn !== 0 || input.dragTurn !== 0;
      playerState.yaw += (input.turn + input.joyTurn) * p.turnSpeed * dt + input.dragTurn;
      input.dragTurn = 0;

      const f = Math.max(-1, Math.min(1, input.forward + input.joyForward));
      if (f !== 0 || turning) activity.t = state.clock.elapsedTime;
      if (f !== 0) {
        const fx = -Math.sin(playerState.yaw);
        const fz = -Math.cos(playerState.yaw);
        let nx = playerState.x + fx * f * p.speed * dt;
        let nz = playerState.z + fz * f * p.speed * dt;

        const inDen = s.scene === "den";
        const colliders = inDen ? [CONFIG.den.table] : COLLIDERS;

        if (inDen) {
          const b = CONFIG.den.bounds;
          nx = Math.max(b.xMin, Math.min(b.xMax, nx));
          nz = Math.max(b.zMin, Math.min(b.zMax, nz));
        } else {
          nx = Math.max(-p.bounds.x, Math.min(p.bounds.x, nx));
          nz = Math.max(-p.bounds.z, Math.min(p.bounds.z, nz));
        }

        for (const [cx, cz, cr] of colliders) {
          const dx = nx - cx;
          const dz = nz - cz;
          const min = cr + p.radius;
          const d2 = dx * dx + dz * dz;
          if (d2 < min * min && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            nx = cx + (dx / d) * min;
            nz = cz + (dz / d) * min;
          }
        }
        playerState.x = nx;
        playerState.z = nz;
      }
    }

    // first-person camera with a faint walk bob
    const moving = !frozen && (input.forward !== 0 || Math.abs(input.joyForward) > 0.1);
    const bob = moving ? Math.sin(state.clock.elapsedTime * 7.5) * 0.04 : 0;
    state.camera.position.set(playerState.x, p.eyeHeight + bob, playerState.z);
    state.camera.rotation.set(-0.05, playerState.yaw, 0, "YXZ");
  });
  return null;
}
