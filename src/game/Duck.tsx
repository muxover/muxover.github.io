import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CONFIG } from "../config";
import { STATIONS, DUCK, type Station, type StationId } from "../content";
import { psxMaterial } from "../render/psx";
import { activity, duckState, playerState } from "./input";
import { useStore } from "../store";

type Mode = "idle" | "walk" | "wait" | "home" | "creep";

const IDLE_BEFORE_CREEP = 45;
const CREEP_COOLDOWN = 60;

// Where the duck stands for each station: pulled toward the plaza center
// so it never clips into the prop itself.
function waypoint(st: Station): [number, number] {
  const len = Math.hypot(st.x, st.z) || 1;
  const k = Math.max(0, 1 - 1.7 / len);
  return [st.x * k, st.z * k];
}

// Lives at module scope, not in a ref, so the duck remembers where it was and
// who it met when the street unmounts during a den visit and mounts back.
const brain = {
  mode: "idle" as Mode,
  greeted: false,
  greetT: 0,
  doneSaid: false,
  completeSaid: false,
  lastIdleLine: 0,
  stared: false,
  stareT: 0,
  lastCreep: 0,
  waitStart: 0,
  gaveUp: false,
  delivered: new Set<StationId>(),
  target: null as Station | null,
  tx: CONFIG.duck.lampSpot[0] as number,
  tz: CONFIG.duck.lampSpot[1] as number,
  yaw: 0,
};

const pick = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)];

export function Duck() {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const wingL = useRef<THREE.Mesh>(null!);
  const wingR = useRef<THREE.Mesh>(null!);
  const smoke = useRef<THREE.Group>(null!);

  const restored = useRef(false);

  const mats = useMemo(
    () => ({
      // faint white self-glow keeps the duck reading as white under the warm lamp
      cream: psxMaterial({ color: CONFIG.palette.cream, emissive: "#cfcabe", emissiveIntensity: 0.32 }),
      beak: psxMaterial({ color: CONFIG.palette.beak, emissive: CONFIG.palette.beak, emissiveIntensity: 0.18 }),
      dark: psxMaterial({ color: "#1b1b18" }),
      ember: psxMaterial({ color: "#3a1208", emissive: CONFIG.palette.ember, emissiveIntensity: 2.2, flicker: true }),
      ciggy: psxMaterial({ color: "#ddd6c8" }),
      // one material per puff — opacity animates independently
      smoke: [0, 1, 2].map(
        () => new THREE.SpriteMaterial({ color: "#8b948f", transparent: true, opacity: 0.35, depthWrite: false }),
      ),
    }),
    [],
  );

  useFrame((state, rawDt) => {
    const s = useStore.getState();
    const dt = Math.min(rawDt, 0.1);
    const t = state.clock.elapsedTime;
    // stepped time gives the low-fps animation feel without hurting input
    const tq = Math.floor(t * CONFIG.look.animFps) / CONFIG.look.animFps;
    const f = brain;
    const g = root.current;
    if (!g || s.phase !== "play") return;

    // returning from the den: drop the duck back where it actually was
    if (!restored.current) {
      g.position.set(duckState.x, 0, duckState.z);
      g.rotation.y = f.yaw;
      restored.current = true;
    }

    duckState.x = g.position.x;
    duckState.z = g.position.z;
    const pdx = playerState.x - g.position.x;
    const pdz = playerState.z - g.position.z;
    const playerDist = Math.hypot(pdx, pdz);
    // duck's beak is its local -Z, so this yaw points the face at the player
    const playerYaw = Math.atan2(-pdx, -pdz);

    const unvisited = STATIONS.filter((st) => !st.hidden && !s.visited[st.id]);
    const nextTarget = () => {
      if (unvisited.length === 0) return null;
      let best = unvisited[0];
      let bd = Infinity;
      for (const st of unvisited) {
        const d = Math.hypot(st.x - g.position.x, st.z - g.position.z);
        if (d < bd) {
          bd = d;
          best = st;
        }
      }
      return best;
    };

    const giveUp = (line: string) => {
      f.gaveUp = true;
      f.target = null;
      [f.tx, f.tz] = CONFIG.duck.lampSpot;
      f.mode = "home";
      s.say(line, 5200);
    };

    // stations the visitor opened on their own, that the duck never escorted
    // them to (the current target doesn't count — it's mid-delivery)
    const skipped = STATIONS.filter(
      (st) => !st.hidden && s.visited[st.id] && st.id !== f.target?.id && !f.delivered.has(st.id),
    ).length;

    // 100% completion: every station seen, including the hidden den
    if (!f.completeSaid && !s.panel && STATIONS.every((st) => s.visited[st.id])) {
      f.completeSaid = true;
      s.say(DUCK.complete, 6000);
    }

    // after the visitor blows off two stations on their own, the duck stops
    // escorting and shuffles back to the lamp — but keeps guiding from a distance
    if (!f.gaveUp && (f.mode === "walk" || f.mode === "wait" || f.mode === "creep") && skipped >= 2) {
      giveUp(pick(DUCK.gaveUp));
    }

    // visitor has been frozen in place for a while — wander over to check on
    // them and say something. this still happens after it gives up escorting:
    // it guides and talks from a distance, it just won't walk the tour anymore.
    const idleFor = t - Math.max(activity.t, f.lastCreep);
    if (
      (f.mode === "idle" || f.mode === "wait") &&
      f.greeted &&
      !s.panel &&
      idleFor > IDLE_BEFORE_CREEP &&
      playerDist > 1.8
    ) {
      f.mode = "creep";
      f.stared = false;
    }

    if (f.mode === "creep") {
      const moved = t - activity.t < 1;
      if (moved) {
        // they're alive after all — back to business
        f.lastCreep = t + CREEP_COOLDOWN;
        f.mode = "home";
        f.target = null;
        [f.tx, f.tz] = CONFIG.duck.lampSpot;
      } else if (playerDist > 1.4) {
        const step = Math.min(playerDist, CONFIG.duck.speed * dt);
        g.position.x += (pdx / playerDist) * step;
        g.position.z += (pdz / playerDist) * step;
        f.yaw = playerYaw;
      } else {
        f.yaw = playerYaw;
        if (!f.stared) {
          f.stared = true;
          f.stareT = t;
          s.say(pick(DUCK.stare));
        } else if (t - f.stareT > 4.5) {
          // said its piece — shuffle back to the lamp
          f.lastCreep = t + CREEP_COOLDOWN;
          f.mode = "home";
          f.target = null;
          [f.tx, f.tz] = CONFIG.duck.lampSpot;
        }
      }
    }

    if (f.mode === "idle") {
      if (!f.greeted && playerDist < CONFIG.duck.greetRadius) {
        f.greeted = true;
        f.greetT = t;
        const at3am = new Date().getHours() === 3;
        s.say(at3am ? DUCK.greeting3am : DUCK.greetings[Math.floor(Math.random() * DUCK.greetings.length)]);
      }
      if (f.greeted && t - f.greetT > 3.5) {
        // already explored a couple of stations alone before the tour began —
        // don't bother offering to guide
        if (skipped >= 2 && !f.gaveUp) giveUp(pick(DUCK.gaveUp));
        const st = f.gaveUp ? null : nextTarget();
        if (st) {
          f.target = st;
          [f.tx, f.tz] = waypoint(st);
          f.mode = "walk";
          s.say(pick(DUCK.follow));
        } else if (!f.doneSaid && !f.gaveUp && playerDist < 4) {
          f.doneSaid = true;
          s.say(DUCK.allDone);
        } else if (playerDist < 3.5 && t - f.lastIdleLine > 22) {
          f.lastIdleLine = t;
          s.say(pick(DUCK.idle));
        }
      }
    } else if (f.mode === "walk" || f.mode === "home") {
      const dx = f.tx - g.position.x;
      const dz = f.tz - g.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.25) {
        if (f.mode === "home") {
          f.mode = "idle";
        } else {
          f.mode = "wait";
          f.waitStart = t;
        }
      } else {
        const step = Math.min(d, CONFIG.duck.speed * dt);
        g.position.x += (dx / d) * step;
        g.position.z += (dz / d) * step;
        f.yaw = Math.atan2(-dx, -dz); // face the way it's walking
      }
    } else if (f.mode === "wait") {
      f.yaw = playerYaw; // turn and face the visitor, beckoning
      const visited = f.target && s.visited[f.target.id];
      const far = f.target ? playerDist > f.target.radius + 3.5 : false;
      const advance = () => {
        const st = nextTarget();
        if (st) {
          f.target = st;
          [f.tx, f.tz] = waypoint(st);
          f.mode = "walk";
        } else {
          f.target = null;
          [f.tx, f.tz] = CONFIG.duck.lampSpot;
          f.mode = "home";
        }
      };
      if (visited) {
        if (f.target) f.delivered.add(f.target.id);
        advance();
      } else if (far && t - f.waitStart > 12) {
        // the visitor clearly isn't following — give up and head back to the lamp
        giveUp(pick(DUCK.ignored));
      }
    }

    if (f.mode === "idle") f.yaw = playerDist < 6 ? playerYaw : f.yaw;
    // shortest-arc turn so the duck never spins the long way round
    let dyaw = f.yaw - g.rotation.y;
    dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    g.rotation.y += dyaw * Math.min(1, dt * 6);

    // animation poses, quantized to animFps
    const walking = f.mode === "walk" || f.mode === "home" || (f.mode === "creep" && playerDist > 1.4);
    const hop = walking ? Math.abs(Math.sin(tq * 9)) * 0.07 : 0;
    const waddle = walking ? Math.sin(tq * 9) * 0.13 : 0;
    const breathe = walking ? 0 : Math.sin(tq * 1.6) * 0.018;
    body.current.position.y = hop;
    body.current.rotation.z = waddle;
    body.current.scale.y = 1 + breathe;

    // tired head: droops while idle, perks up slightly when beckoning
    head.current.rotation.x = f.mode === "wait" ? -0.08 : 0.14 + Math.sin(tq * 0.8) * 0.05;
    const beckon = f.mode === "wait" ? Math.sin(tq * 7) * 0.5 : 0;
    wingL.current.rotation.z = 0.1 + beckon;
    wingR.current.rotation.z = -0.1;

    // cigarette smoke drifting up
    smoke.current.children.forEach((spr, i) => {
      const cycle = (t * 0.35 + i * 0.33) % 1;
      spr.position.set(Math.sin((t + i * 7) * 1.7) * 0.07, cycle * 0.8, 0.02);
      const sc = 0.05 + cycle * 0.16;
      spr.scale.set(sc, sc, sc);
      (spr as THREE.Sprite).material.opacity = 0.32 * (1 - cycle);
    });
  });

  return (
    <group ref={root} position={[CONFIG.duck.lampSpot[0], 0, CONFIG.duck.lampSpot[1]]}>
      <group ref={body}>
        {/* plump little body + stubby tail */}
        <mesh position={[0, 0.4, 0.02]} material={mats.cream}>
          <boxGeometry args={[0.5, 0.5, 0.64]} />
        </mesh>
        <mesh position={[0, 0.56, 0.36]} rotation-x={0.55} material={mats.cream}>
          <boxGeometry args={[0.24, 0.12, 0.22]} />
        </mesh>

        {/* wings tucked against the body */}
        <mesh ref={wingL} position={[0.28, 0.42, 0.03]} material={mats.cream}>
          <boxGeometry args={[0.08, 0.3, 0.46]} />
        </mesh>
        <mesh ref={wingR} position={[-0.28, 0.42, 0.03]} material={mats.cream}>
          <boxGeometry args={[0.08, 0.3, 0.46]} />
        </mesh>

        {/* big fluffy head — yaw 0 faces -z, so the face sits on the -z side */}
        <group ref={head} position={[0, 0.92, -0.14]}>
          <mesh material={mats.cream}>
            <boxGeometry args={[0.44, 0.42, 0.42]} />
          </mesh>
          {/* heavy, half-closed eyelids: cream lid with a dark sleepy slit */}
          {[0.12, -0.12].map((x) => (
            <group key={x} position={[x, 0.04, -0.205]}>
              <mesh position={[0, 0.03, 0]} material={mats.cream}>
                <boxGeometry args={[0.12, 0.08, 0.02]} />
              </mesh>
              <mesh material={mats.dark}>
                <boxGeometry args={[0.1, 0.04, 0.03]} />
              </mesh>
            </group>
          ))}
          {/* short flat orange bill */}
          <mesh position={[0, -0.07, -0.22]} material={mats.beak}>
            <boxGeometry args={[0.24, 0.1, 0.18]} />
          </mesh>
          <mesh position={[0, -0.12, -0.18]} material={mats.beak}>
            <boxGeometry args={[0.2, 0.04, 0.12]} />
          </mesh>
          {/* cigarette hanging from the corner of the bill, lit ember + smoke */}
          <mesh position={[0.09, -0.1, -0.34]} rotation-x={0.32} material={mats.ciggy}>
            <boxGeometry args={[0.028, 0.028, 0.2]} />
          </mesh>
          <mesh position={[0.09, -0.13, -0.44]} material={mats.ember}>
            <boxGeometry args={[0.035, 0.035, 0.035]} />
          </mesh>
          <group ref={smoke} position={[0.09, -0.1, -0.46]}>
            {mats.smoke.map((m, i) => (
              <sprite key={i} material={m} />
            ))}
          </group>
        </group>

        {/* webbed feet */}
        {[0.13, -0.13].map((x) => (
          <mesh key={x} position={[x, 0.035, -0.06]} material={mats.beak}>
            <boxGeometry args={[0.15, 0.06, 0.26]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
