import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CONFIG } from "../config";
import { STATIONS, STACK, type StationId } from "../content";
import { psxMaterial, setPSXMap } from "../render/psx";
import { signTex, screenTex, woodTex, concreteTex } from "../render/textures";
import { duckState, playerState } from "./input";
import { useStore } from "../store";

const TRASH_POS = [-4.6, 7.2] as const;

// Proximity watcher: sets the HUD prompt and fires the duck's line the
// first time the player wanders into a station. The duck itself and the
// trash can are interactable too — they just talk back.
function Proximity() {
  const said = useRef<Partial<Record<StationId, boolean>>>({});
  useFrame(() => {
    const s = useStore.getState();
    if (s.phase !== "play") return;
    let hit: (typeof STATIONS)[number] | null = null;
    let best = Infinity;
    for (const st of STATIONS) {
      const d = Math.hypot(st.x - playerState.x, st.z - playerState.z);
      if (d < st.radius && d < best) {
        best = d;
        hit = st;
      }
    }
    if (hit) {
      s.setPrompt(hit.id);
      if (!said.current[hit.id]) {
        said.current[hit.id] = true;
        s.say(hit.duckLine);
      }
      return;
    }
    if (Math.hypot(duckState.x - playerState.x, duckState.z - playerState.z) < 1.7) {
      s.setPrompt("duck");
    } else if (Math.hypot(TRASH_POS[0] - playerState.x, TRASH_POS[1] - playerState.z) < 1.5) {
      s.setPrompt("trash");
    } else {
      s.setPrompt(null);
    }
  });
  return null;
}

const MONITOR_SLOTS = [
  // [x, y, z] two stacked rows of three along the north wall
  [4.6, 0.95, -8.4],
  [6.4, 0.95, -8.5],
  [8.2, 0.95, -8.4],
  [4.6, 2.0, -8.45],
  [6.4, 2.0, -8.55],
  [8.2, 2.0, -8.45],
] as const;

function Monitors() {
  const repos = useStore((s) => s.repos);
  const status = useStore((s) => s.dataStatus);

  const mats = useMemo(
    () => ({
      shell: psxMaterial({ color: "#2e3331" }),
      crate: psxMaterial({ map: woodTex(), color: "#b8a78d" }),
      sign: psxMaterial({ map: signTex(["PROJECTS"], { fg: "#ff7a18" }), unlit: true, flicker: true }),
      screens: MONITOR_SLOTS.map(() => psxMaterial({ map: screenTex(["NO SIGNAL"], "#557766"), unlit: true })),
    }),
    [],
  );

  // repaint the CRT faces once live repos arrive
  useEffect(() => {
    const top = repos.slice(0, CONFIG.github.maxScreens);
    mats.screens.forEach((m, i) => {
      const repo = top[i];
      if (repo) {
        setPSXMap(
          m,
          screenTex([
            `> ${repo.name}`,
            repo.language ?? "",
            `* ${repo.stargazers_count}`,
          ]),
        );
      } else if (status === "lost") {
        setPSXMap(m, screenTex(["SIGNAL", "LOST"], "#cc5544"));
      }
    });
  }, [repos, status, mats]);

  return (
    <group>
      {MONITOR_SLOTS.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation-y={(i % 3) * 0.06 - 0.06}>
          <mesh material={mats.shell}>
            <boxGeometry args={[1.5, 1.0, 1.0]} />
          </mesh>
          <mesh position={[0, 0, 0.51]} material={mats.screens[i]}>
            <planeGeometry args={[1.25, 0.82]} />
          </mesh>
        </group>
      ))}
      {/* crates under the bottom row */}
      {[4.6, 6.4, 8.2].map((x) => (
        <mesh key={x} position={[x, 0.22, -8.45]} material={mats.crate}>
          <boxGeometry args={[1.6, 0.45, 1.1]} />
        </mesh>
      ))}
      <mesh position={[6.4, 3.0, -8.6]} material={mats.sign}>
        <planeGeometry args={[3.2, 0.9]} />
      </mesh>
    </group>
  );
}

function StatsTerminal() {
  const profile = useStore((s) => s.profile);
  const status = useStore((s) => s.dataStatus);

  const screenMat = useMemo(() => psxMaterial({ map: screenTex(["..."], "#557766"), unlit: true, flicker: true }), []);
  const shell = useMemo(() => psxMaterial({ map: concreteTex(), color: "#828c87" }), []);

  useEffect(() => {
    if (profile) {
      setPSXMap(
        screenMat,
        screenTex([
          "> SIGNAL OK",
          `repos     ${profile.public_repos}`,
          `followers ${profile.followers}`,
          `following ${profile.following}`,
          `since     ${new Date(profile.created_at).getFullYear()}`,
        ], "#3affd4"),
      );
    } else if (status === "lost") {
      setPSXMap(screenMat, screenTex(["> SIGNAL LOST", "", "github is", "unreachable"], "#cc5544"));
    }
  }, [profile, status, screenMat]);

  return (
    <group position={[-9.6, 0, -0.5]} rotation-y={Math.PI / 2}>
      <mesh position={[0, 1.0, 0]} material={shell}>
        <boxGeometry args={[1.4, 2.0, 0.6]} />
      </mesh>
      <mesh position={[0, 1.35, 0.31]} material={screenMat}>
        <planeGeometry args={[1.15, 0.9]} />
      </mesh>
    </group>
  );
}

export function Stations() {
  const mats = useMemo(
    () => ({
      wood: psxMaterial({ map: woodTex(), color: "#c5b497" }),
      boardSign: psxMaterial({ map: signTex(["ABOUT", "?"], { fg: "#ffb04a", h: 160 }), unlit: true }),
      vendor: psxMaterial({ color: "#5a2520" }),
      vendorFace: psxMaterial({
        map: signTex(["STACK", ...STACK.slice(0, 4).map((s) => s.toLowerCase())], {
          fg: "#3affd4",
          glow: "#3affd4",
          h: 256,
          fontPx: 34,
        }),
        unlit: true,
        flicker: true,
      }),
      phone: psxMaterial({ color: "#1f4540" }),
      phoneSign: psxMaterial({ map: signTex(["TEL"], { fg: "#ff3b30" }), unlit: true, flicker: true }),
      dark: psxMaterial({ color: "#23282b" }),
      door: psxMaterial({ map: woodTex(), color: "#5a5248" }),
      doorSign: psxMaterial({ map: signTex(["♠"], { fg: "#ff3b30", w: 64, h: 64, fontPx: 40 }), unlit: true, flicker: true }),
      doorGlow: psxMaterial({ color: "#1a0c08", emissive: "#ff4818", emissiveIntensity: 0.35, flicker: true }),
    }),
    [],
  );

  return (
    <group>
      <Proximity />
      <Monitors />
      <StatsTerminal />

      {/* about — noticeboard near the lamp */}
      <group position={[-8.6, 0, -5.2]} rotation-y={0.6}>
        {[-1.0, 1.0].map((x) => (
          <mesh key={x} position={[x, 0.9, 0]} material={mats.wood}>
            <boxGeometry args={[0.12, 1.8, 0.12]} />
          </mesh>
        ))}
        <mesh position={[0, 1.55, 0]} material={mats.boardSign}>
          <boxGeometry args={[2.4, 1.5, 0.08]} />
        </mesh>
      </group>

      {/* stack — vending machine */}
      <group position={[9.8, 0, 2.6]} rotation-y={-Math.PI / 2 + 0.15}>
        <mesh position={[0, 1.05, 0]} material={mats.vendor}>
          <boxGeometry args={[1.3, 2.1, 0.9]} />
        </mesh>
        <mesh position={[0, 1.15, 0.46]} material={mats.vendorFace}>
          <planeGeometry args={[1.0, 1.6]} />
        </mesh>
      </group>

      {/* contact — payphone */}
      <group position={[-9.4, 0, 4.6]} rotation-y={Math.PI / 2 - 0.2}>
        <mesh position={[0, 1.2, 0]} material={mats.phone}>
          <boxGeometry args={[0.95, 2.4, 0.95]} />
        </mesh>
        <mesh position={[0, 2.25, 0.49]} material={mats.phoneSign}>
          <planeGeometry args={[0.8, 0.35]} />
        </mesh>
        <mesh position={[0.18, 1.3, 0.5]} material={mats.dark}>
          <boxGeometry args={[0.12, 0.45, 0.1]} />
        </mesh>
      </group>

      {/* the den — an unmarked door in the dark south-west corner */}
      <group position={[-10.2, 0, 9.9]}>
        <mesh position={[0, 1.05, 0]} material={mats.door}>
          <boxGeometry args={[1.1, 2.1, 0.12]} />
        </mesh>
        {/* light leaking under the door */}
        <mesh position={[0, 0.03, -0.12]} material={mats.doorGlow}>
          <boxGeometry args={[1.0, 0.05, 0.06]} />
        </mesh>
        <mesh position={[0, 2.35, -0.08]} rotation-y={Math.PI} material={mats.doorSign}>
          <planeGeometry args={[0.4, 0.4]} />
        </mesh>
      </group>
    </group>
  );
}
