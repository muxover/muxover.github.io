import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { CONFIG } from "../config";
import { STATIONS } from "../content";
import { psxMaterial, shared } from "../render/psx";
import { asphaltTex, buildingTex, woodTex, puddleTex, signTex, concreteTex } from "../render/textures";
import { useStore } from "../store";

// Central per-frame update of the uniforms every PSX material shares.
export function SharedUniforms() {
  const gl = useThree((s) => s.gl);
  const reduced = useStore((s) => s.reduced);
  const buf = useMemo(() => new THREE.Vector2(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    shared.uTime.value = t;
    // streetlamp dips out for a frame or two every so often
    const r = Math.abs(Math.sin(Math.floor(t * 18) * 127.1) * 43758.5453) % 1;
    shared.uLampFlicker.value = r < 0.045 ? 0.5 + r * 4.0 : 1.0;
    gl.getDrawingBufferSize(buf);
    // chaos mode (konami code) cranks the vertex wobble way up
    const div = CONFIG.look.snapDivisor * (useStore.getState().chaos ? 6 : 1);
    shared.uSnap.value.set(buf.x / (2 * div), buf.y / (2 * div));
    shared.uJitterOn.value = reduced ? 0 : 1;
  });
  return null;
}

interface BuildingDef {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  lit: number;
}

const BUILDINGS: BuildingDef[] = [
  // north wall
  { x: -8, z: -12.5, w: 8, h: 9, d: 5, lit: 0.25 },
  { x: 0, z: -13, w: 8, h: 7, d: 6, lit: 0.12 },
  { x: 8, z: -12.5, w: 8, h: 10, d: 5, lit: 0.3 },
  // south wall
  { x: -7, z: 12.5, w: 9, h: 8, d: 5, lit: 0.18 },
  { x: 4, z: 13, w: 10, h: 6, d: 6, lit: 0.1 },
  { x: 12, z: 12.5, w: 7, h: 9, d: 5, lit: 0.22 },
  // east / west walls
  { x: 14.5, z: -5, w: 5, h: 8, d: 9, lit: 0.2 },
  { x: 14.5, z: 5, w: 5, h: 11, d: 9, lit: 0.28 },
  { x: -14.5, z: -5, w: 5, h: 10, d: 9, lit: 0.15 },
  { x: -14.5, z: 5, w: 5, h: 7, d: 9, lit: 0.22 },
];

interface NeonDef {
  text: string;
  x: number;
  y: number;
  z: number;
  ry: number;
  w: number;
  h: number;
  color: string;
  flicker?: boolean;
}

const NEONS: NeonDef[] = [
  { text: "DUCK", x: 5, y: 4.6, z: -9.9, ry: 0, w: 3.2, h: 1.3, color: "#ff7a18", flicker: true },
  { text: "MOTEL", x: -7, y: 5.2, z: -9.9, ry: 0, w: 3.4, h: 1.2, color: "#ff3b30" },
  { text: "OPEN 24H", x: 11.9, y: 3.4, z: -2, ry: -Math.PI / 2, w: 3.0, h: 1.0, color: "#3affd4", flicker: true },
  { text: "NO EXIT", x: -11.9, y: 3.8, z: 7.5, ry: Math.PI / 2, w: 2.6, h: 1.0, color: "#ff3b30" },
  { text: "麺", x: -11.9, y: 4.6, z: -7, ry: Math.PI / 2, w: 1.4, h: 1.4, color: "#ff7a18" },
];

// stays dark until the visitor has seen every station, den included
function CompletionNeon() {
  const done = useStore((s) => STATIONS.every((st) => s.visited[st.id]));
  const mat = useMemo(
    () => psxMaterial({ map: signTex(["100%"], { fg: "#3affd4", fontPx: 64 }), unlit: true, flicker: true }),
    [],
  );
  if (!done) return null;
  return (
    <mesh position={[0, 5.4, -9.95]} material={mat}>
      <planeGeometry args={[2.2, 1.1]} />
    </mesh>
  );
}

export function Plaza() {
  const mats = useMemo(() => {
    const asphalt = asphaltTex();
    asphalt.repeat.set(7, 6);
    return {
      ground: psxMaterial({ map: asphalt, color: "#9aa6a0" }),
      buildings: BUILDINGS.map((b) => psxMaterial({ map: buildingTex(CONFIG.palette.building, b.lit), color: "#cfd6d2" })),
      pole: psxMaterial({ map: concreteTex(), color: "#7e8a85" }),
      lampHead: psxMaterial({ color: "#3a3f3c", emissive: CONFIG.look.lampColor, emissiveIntensity: 1.6 }),
      wood: psxMaterial({ map: woodTex(), color: "#cdbfa8" }),
      metal: psxMaterial({ color: "#55605b" }),
      puddle: psxMaterial({ map: puddleTex(), color: "#ffffff", unlit: true }),
      cone: new THREE.MeshBasicMaterial({
        color: CONFIG.look.lampColor,
        transparent: true,
        opacity: 0.013,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      neons: NEONS.map((n) =>
        psxMaterial({
          map: signTex([n.text], { fg: n.color, w: 256, h: 128, fontPx: n.text.length > 5 ? 48 : 72 }),
          unlit: true,
          flicker: n.flicker,
        }),
      ),
    };
  }, []);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={mats.ground}>
        <planeGeometry args={[30, 26]} />
      </mesh>

      {BUILDINGS.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} material={mats.buildings[i]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}

      <CompletionNeon />

      {NEONS.map((n, i) => (
        <mesh key={n.text} position={[n.x, n.y, n.z]} rotation-y={n.ry} material={mats.neons[i]}>
          <planeGeometry args={[n.w, n.h]} />
        </mesh>
      ))}

      {/* streetlamp — the duck's spot */}
      <group>
        <mesh position={[0, 2.1, 0]} material={mats.pole}>
          <cylinderGeometry args={[0.07, 0.1, 4.2, 6]} />
        </mesh>
        <mesh position={[0, 4.15, 0]} material={mats.lampHead}>
          <boxGeometry args={[0.45, 0.25, 0.45]} />
        </mesh>
        <mesh position={[0, 2.05, 0]} material={mats.cone}>
          <coneGeometry args={[1.7, 4.1, 8, 1, true]} />
        </mesh>
      </group>

      {/* bench */}
      <group position={[5.4, 0, 6.4]} rotation-y={-0.5}>
        <mesh position={[0, 0.42, 0]} material={mats.wood}>
          <boxGeometry args={[2.0, 0.09, 0.55]} />
        </mesh>
        <mesh position={[0, 0.78, -0.26]} rotation-x={-0.25} material={mats.wood}>
          <boxGeometry args={[2.0, 0.5, 0.07]} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 0.2, 0]} material={mats.metal}>
            <boxGeometry args={[0.1, 0.42, 0.5]} />
          </mesh>
        ))}
      </group>

      {/* trash can */}
      <mesh position={[-4.6, 0.35, 7.2]} material={mats.metal}>
        <cylinderGeometry args={[0.28, 0.24, 0.7, 7]} />
      </mesh>

      {/* puddles */}
      {[
        [2.4, 1.8, 1.5],
        [-2.0, 3.2, 1.1],
        [4.0, -3.4, 1.3],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, 0.012, z]} rotation-x={-Math.PI / 2} scale={s} material={mats.puddle}>
          <circleGeometry args={[1, 9]} />
        </mesh>
      ))}
    </group>
  );
}
