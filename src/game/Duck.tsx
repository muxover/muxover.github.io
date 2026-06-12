import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CONFIG } from "../config";
import { STATIONS, DUCK, type Station } from "../content";
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

export function Duck() {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const wingL = useRef<THREE.Mesh>(null!);
  const wingR = useRef<THREE.Mesh>(null!);
  const smoke = useRef<THREE.Group>(null!);

  const fsm = useRef({
    mode: "idle" as Mode,
    greeted: false,
    greetT: 0,
    doneSaid: false,
    completeSaid: false,
    lastIdleLine: 0,
    stared: false,
    lastCreep: 0,
    target: null as Station | null,
    tx: CONFIG.duck.lampSpot[0] as number,
    tz: CONFIG.duck.lampSpot[1] as number,
    yaw: 0,
  });

  const mats = useMemo(
    () => ({
      cream: psxMaterial({ color: CONFIG.palette.cream }),
      beak: psxMaterial({ color: CONFIG.palette.beak }),
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
    const f = fsm.current;
    const g = root.current;
    if (!g || s.phase !== "play") return;

    duckState.x = g.position.x;
    duckState.z = g.position.z;
    const pdx = playerState.x - g.position.x;
    const pdz = playerState.z - g.position.z;
    const playerDist = Math.hypot(pdx, pdz);
    const playerYaw = Math.atan2(-pdx, -pdz) + Math.PI;

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

    // 100% completion: every station seen, including the hidden den
    if (!f.completeSaid && !s.panel && STATIONS.every((st) => s.visited[st.id])) {
      f.completeSaid = true;
      s.say(DUCK.complete, 6000);
    }

    // visitor has been frozen in place for a while — go investigate
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
      } else if (playerDist > 1.4) {
        const step = Math.min(playerDist, CONFIG.duck.speed * dt);
        g.position.x += (pdx / playerDist) * step;
        g.position.z += (pdz / playerDist) * step;
        f.yaw = playerYaw;
      } else {
        f.yaw = playerYaw;
        if (!f.stared) {
          f.stared = true;
          s.say(DUCK.stare[Math.floor(Math.random() * DUCK.stare.length)]);
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
        const st = nextTarget();
        if (st) {
          f.target = st;
          [f.tx, f.tz] = waypoint(st);
          f.mode = "walk";
          s.say(DUCK.follow);
        } else if (!f.doneSaid && playerDist < 4) {
          f.doneSaid = true;
          s.say(DUCK.allDone);
        } else if (playerDist < 4 && t - f.lastIdleLine > 16) {
          f.lastIdleLine = t;
          s.say(DUCK.idle[Math.floor(Math.random() * DUCK.idle.length)]);
        }
      }
    } else if (f.mode === "walk" || f.mode === "home") {
      const dx = f.tx - g.position.x;
      const dz = f.tz - g.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.25) {
        f.mode = f.mode === "home" ? "idle" : "wait";
      } else {
        const step = Math.min(d, CONFIG.duck.speed * dt);
        g.position.x += (dx / d) * step;
        g.position.z += (dz / d) * step;
        f.yaw = Math.atan2(-dx, -dz) + Math.PI;
      }
    } else if (f.mode === "wait") {
      f.yaw = playerYaw; // look back at the player, beckoning
      if (f.target && s.visited[f.target.id]) {
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
      }
    }

    if (f.mode === "idle") f.yaw = playerDist < 6 ? playerYaw : f.yaw;
    g.rotation.y += (f.yaw - g.rotation.y) * Math.min(1, dt * 6);

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
        {/* body + tail */}
        <mesh position={[0, 0.42, 0]} material={mats.cream}>
          <boxGeometry args={[0.56, 0.46, 0.78]} />
        </mesh>
        <mesh position={[0, 0.58, 0.42]} rotation-x={0.5} material={mats.cream}>
          <boxGeometry args={[0.22, 0.1, 0.26]} />
        </mesh>

        {/* wings */}
        <mesh ref={wingL} position={[0.31, 0.46, 0.05]} material={mats.cream}>
          <boxGeometry args={[0.08, 0.26, 0.5]} />
        </mesh>
        <mesh ref={wingR} position={[-0.31, 0.46, 0.05]} material={mats.cream}>
          <boxGeometry args={[0.08, 0.26, 0.5]} />
        </mesh>

        {/* head — yaw 0 faces -z so the face sits on the -z side */}
        <group ref={head} position={[0, 0.9, -0.22]}>
          <mesh material={mats.cream}>
            <boxGeometry args={[0.32, 0.32, 0.34]} />
          </mesh>
          {/* heavy eyelids: dark slits under cream lids */}
          {[0.11, -0.11].map((x) => (
            <mesh key={x} position={[x, 0.045, -0.175]} material={mats.dark}>
              <boxGeometry args={[0.07, 0.035, 0.01]} />
            </mesh>
          ))}
          <mesh position={[0, -0.04, -0.26]} material={mats.beak}>
            <boxGeometry args={[0.14, 0.07, 0.2]} />
          </mesh>
          {/* cigarette + ember */}
          <mesh position={[0.06, -0.09, -0.4]} rotation-x={0.35} material={mats.ciggy}>
            <boxGeometry args={[0.025, 0.025, 0.18]} />
          </mesh>
          <mesh position={[0.06, -0.123, -0.49]} material={mats.ember}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
          </mesh>
          <group ref={smoke} position={[0.06, -0.05, -0.5]}>
            {mats.smoke.map((m, i) => (
              <sprite key={i} material={m} />
            ))}
          </group>
        </group>

        {/* feet */}
        {[0.14, -0.14].map((x) => (
          <mesh key={x} position={[x, 0.035, -0.04]} material={mats.beak}>
            <boxGeometry args={[0.14, 0.06, 0.24]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
