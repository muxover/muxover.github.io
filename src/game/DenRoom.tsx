import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CONFIG } from "../config";
import { psxMaterial } from "../render/psx";
import { woodTex, concreteTex, signTex } from "../render/textures";
import { cardFaceTex, cardBackTex } from "../render/cards";
import { useBlackjack, type Card } from "./blackjack";
import { playerState } from "./input";
import { useStore } from "../store";

// Watches the player's distance to the exit door and raises the LEAVE prompt.
function DenExit() {
  useFrame(() => {
    const s = useStore.getState();
    if (s.scene !== "den" || s.phase !== "play") return;
    const [dx, dz] = CONFIG.den.door;
    const near = Math.hypot(dx - playerState.x, dz - playerState.z) < CONFIG.den.doorRadius;
    s.setPrompt(near ? "leave" : s.prompt === "leave" ? null : s.prompt);
  });
  return null;
}

function CardRow({ cards, z, hideHole }: { cards: Card[]; z: number; hideHole: boolean }) {
  return (
    <group>
      {cards.map((c, i) => {
        const x = (i - (cards.length - 1) / 2) * 0.34;
        const tex = hideHole && i === 1 ? cardBackTex() : cardFaceTex(c);
        return (
          <mesh key={i} position={[x, 1.0, z + i * 0.012]} rotation-x={-0.95}>
            <planeGeometry args={[0.3, 0.42]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function DenCards() {
  const player = useBlackjack((s) => s.player);
  const duck = useBlackjack((s) => s.duck);
  const phase = useBlackjack((s) => s.phase);
  return (
    <group>
      <CardRow cards={player} z={0.46} hideHole={false} />
      <CardRow cards={duck} z={-0.42} hideHole={phase === "player"} />
    </group>
  );
}

// The duck dealer, seated across the felt, facing the player (+z). Same crunchy
// proportions as the street duck, just posed sitting with a lazy smoke.
function DealerDuck() {
  const smoke = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const dealWing = useRef<THREE.Mesh>(null!);
  const deal = useRef({ at: -10, prevCount: 0 });
  const mats = useMemo(
    () => ({
      cream: psxMaterial({ color: CONFIG.palette.cream, emissive: "#cfcabe", emissiveIntensity: 0.34 }),
      beak: psxMaterial({ color: CONFIG.palette.beak, emissive: CONFIG.palette.beak, emissiveIntensity: 0.2 }),
      dark: psxMaterial({ color: "#1b1b18" }),
      ember: psxMaterial({ color: "#3a1208", emissive: CONFIG.palette.ember, emissiveIntensity: 2.4, flicker: true }),
      ciggy: psxMaterial({ color: "#ddd6c8" }),
      chair: psxMaterial({ map: woodTex(), color: "#7a6a50" }),
      smoke: [0, 1, 2].map(
        () => new THREE.SpriteMaterial({ color: "#8b948f", transparent: true, opacity: 0.32, depthWrite: false }),
      ),
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // a card just landed on the felt — throw a quick dealing motion
    const bj = useBlackjack.getState();
    const count = bj.player.length + bj.duck.length;
    if (count > deal.current.prevCount) deal.current.at = t;
    deal.current.prevCount = count;

    // lazy idle: slow head sway + breathing tilt
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6) * 0.08;
      head.current.rotation.x = 0.05 + Math.sin(t * 1.1) * 0.04;
    }
    // dealing wing flicks forward then settles back over ~0.45s
    if (dealWing.current) {
      const k = Math.max(0, 1 - (t - deal.current.at) / 0.45);
      dealWing.current.rotation.x = 0.5 + k * 0.9;
    }

    smoke.current?.children.forEach((spr, i) => {
      const cycle = (t * 0.3 + i * 0.33) % 1;
      spr.position.set(Math.sin((t + i * 7) * 1.5) * 0.06, cycle * 0.8, 0.02);
      const sc = 0.05 + cycle * 0.16;
      spr.scale.set(sc, sc, sc);
      (spr as THREE.Sprite).material.opacity = 0.3 * (1 - cycle);
    });
  });

  return (
    <group position={[0, 0, -1.05]}>
      {/* chair */}
      <mesh position={[0, 0.45, -0.5]} material={mats.chair}>
        <boxGeometry args={[0.9, 0.12, 0.5]} />
      </mesh>
      <mesh position={[0, 0.95, -0.72]} material={mats.chair}>
        <boxGeometry args={[0.9, 1.1, 0.1]} />
      </mesh>

      {/* body, sitting upright behind the felt */}
      <mesh position={[0, 0.92, -0.12]} material={mats.cream}>
        <boxGeometry args={[0.56, 0.62, 0.56]} />
      </mesh>

      {/* wings resting forward on the table — the right one deals */}
      <mesh ref={dealWing} position={[0.3, 0.86, 0.12]} rotation-x={0.5} material={mats.cream}>
        <boxGeometry args={[0.1, 0.24, 0.4]} />
      </mesh>
      <mesh position={[-0.3, 0.86, 0.12]} rotation-x={0.5} material={mats.cream}>
        <boxGeometry args={[0.1, 0.24, 0.4]} />
      </mesh>

      {/* head — authored facing +z (toward the player) */}
      <group ref={head} position={[0, 1.42, 0.04]}>
        <mesh material={mats.cream}>
          <boxGeometry args={[0.44, 0.42, 0.42]} />
        </mesh>
        {[0.12, -0.12].map((x) => (
          <group key={x} position={[x, 0.04, 0.205]}>
            <mesh position={[0, 0.03, 0]} material={mats.cream}>
              <boxGeometry args={[0.12, 0.08, 0.02]} />
            </mesh>
            <mesh material={mats.dark}>
              <boxGeometry args={[0.1, 0.04, 0.03]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.07, 0.22]} material={mats.beak}>
          <boxGeometry args={[0.24, 0.1, 0.18]} />
        </mesh>
        <mesh position={[0, -0.12, 0.18]} material={mats.beak}>
          <boxGeometry args={[0.2, 0.04, 0.12]} />
        </mesh>
        {/* cigarette + ember + smoke */}
        <mesh position={[0.09, -0.1, 0.34]} rotation-x={-0.32} material={mats.ciggy}>
          <boxGeometry args={[0.028, 0.028, 0.2]} />
        </mesh>
        <mesh position={[0.09, -0.13, 0.44]} material={mats.ember}>
          <boxGeometry args={[0.035, 0.035, 0.035]} />
        </mesh>
        <group ref={smoke} position={[0.09, -0.1, 0.46]}>
          {mats.smoke.map((m, i) => (
            <sprite key={i} material={m} />
          ))}
        </group>
      </group>
    </group>
  );
}

export function DenRoom() {
  const mats = useMemo(() => {
    const floorTex = concreteTex();
    floorTex.repeat.set(4, 4);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    return {
      floor: psxMaterial({ map: floorTex, color: "#6b6258" }),
      wall: psxMaterial({ map: concreteTex(), color: "#4a443e" }),
      ceiling: psxMaterial({ color: "#2a2622" }),
      felt: psxMaterial({ color: "#164d34", emissive: "#0c3322", emissiveIntensity: 0.4 }),
      apron: psxMaterial({ map: woodTex(), color: "#5a4632" }),
      bulb: psxMaterial({ color: "#3a3026", emissive: CONFIG.look.lampColor, emissiveIntensity: 2.0, flicker: true }),
      wire: psxMaterial({ color: "#15120f" }),
      door: psxMaterial({ map: woodTex(), color: "#6a5c46" }),
      exitSign: psxMaterial({ map: signTex(["EXIT"], { fg: "#3affd4", glow: "#3affd4" }), unlit: true, flicker: true }),
    };
  }, []);

  const R = 4; // room half-extent

  return (
    <group>
      <DenExit />

      {/* shell */}
      <mesh rotation-x={-Math.PI / 2} material={mats.floor}>
        <planeGeometry args={[R * 2, R * 2]} />
      </mesh>
      <mesh position={[0, 4, 0]} rotation-x={Math.PI / 2} material={mats.ceiling}>
        <planeGeometry args={[R * 2, R * 2]} />
      </mesh>
      <mesh position={[0, 2, -R]} material={mats.wall}>
        <boxGeometry args={[R * 2, 4, 0.2]} />
      </mesh>
      <mesh position={[0, 2, R]} material={mats.wall}>
        <boxGeometry args={[R * 2, 4, 0.2]} />
      </mesh>
      <mesh position={[-R, 2, 0]} material={mats.wall}>
        <boxGeometry args={[0.2, 4, R * 2]} />
      </mesh>
      <mesh position={[R, 2, 0]} material={mats.wall}>
        <boxGeometry args={[0.2, 4, R * 2]} />
      </mesh>

      {/* hanging bulb over the table */}
      <mesh position={[0, 3.4, 0]} material={mats.wire}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 4]} />
      </mesh>
      <mesh position={[0, 2.78, 0]} material={mats.bulb}>
        <sphereGeometry args={[0.12, 8, 6]} />
      </mesh>

      {/* table */}
      <mesh position={[0, 0.95, 0]} material={mats.felt}>
        <boxGeometry args={[2.2, 0.06, 1.3]} />
      </mesh>
      <mesh position={[0, 0.82, 0]} material={mats.apron}>
        <boxGeometry args={[2.1, 0.22, 1.2]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={mats.apron}>
        <cylinderGeometry args={[0.18, 0.22, 0.84, 8]} />
      </mesh>

      <DealerDuck />
      <DenCards />

      {/* exit door on the back (+z) wall */}
      <group position={[CONFIG.den.door[0], 0, R - 0.08]}>
        <mesh position={[0, 1.15, 0]} material={mats.door}>
          <boxGeometry args={[1.1, 2.3, 0.12]} />
        </mesh>
        <mesh position={[0, 2.55, 0.02]} material={mats.exitSign}>
          <planeGeometry args={[0.9, 0.4]} />
        </mesh>
      </group>
    </group>
  );
}
