import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CONFIG } from "./config";
import { AWAY_TITLES } from "./content";
import { loadGitHub } from "./api/github";
import { bindKeyboard, input } from "./game/input";
import { Plaza } from "./game/Plaza";
import { Stations } from "./game/Stations";
import { Duck } from "./game/Duck";
import { Player } from "./game/Player";
import { PostFX } from "./render/PostFX";
import { Hud } from "./ui/Hud";
import { Panel } from "./ui/Panel";
import { LoadingScreen } from "./ui/LoadingScreen";
import { TextFallback } from "./ui/TextFallback";
import { Joystick } from "./ui/Joystick";
import { useStore } from "./store";

function calcDpr(touch: boolean): number {
  const target = touch ? CONFIG.look.renderHeightMobile : CONFIG.look.renderHeight;
  return Math.min(1, target / window.innerHeight);
}

export default function App() {
  const phase = useStore((s) => s.phase);
  const textMode = useStore((s) => s.textMode);
  const touch = useStore((s) => s.touch);
  const [dpr, setDpr] = useState(() => calcDpr(useStore.getState().touch));
  const drag = useRef<number | null>(null);

  useEffect(() => {
    loadGitHub().then((d) => useStore.getState().setData(d));
  }, []);

  useEffect(() => {
    return bindKeyboard(
      () => useStore.getState().interact(),
      () => useStore.getState().closePanel(),
    );
  }, []);

  // guilt-trip the tab title when the visitor wanders off
  useEffect(() => {
    const home = document.title;
    const onVisibility = () => {
      document.title = document.hidden ? AWAY_TITLES[Math.floor(Math.random() * AWAY_TITLES.length)] : home;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // konami code → chaos mode
  useEffect(() => {
    const code = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "KeyB", "KeyA",
    ];
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      i = e.code === code[i] ? i + 1 : e.code === code[0] ? 1 : 0;
      if (i === code.length) {
        i = 0;
        useStore.getState().toggleChaos();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onResize = () => setDpr(calcDpr(useStore.getState().touch));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (textMode) return <TextFallback />;

  return (
    <div
      className="app"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") drag.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (drag.current !== null && e.buttons & 1 && e.pointerType === "mouse") {
          input.dragTurn += (drag.current - e.clientX) * 0.0042;
          drag.current = e.clientX;
        }
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <Canvas
        flat
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 68, near: 0.1, far: 55 }}
      >
        <color attach="background" args={[CONFIG.look.fogColor]} />
        <Plaza />
        <Stations />
        <Duck />
        <Player />
        <PostFX />
      </Canvas>
      <Hud />
      <Panel />
      {touch && phase === "play" && <Joystick />}
      {phase === "loading" && <LoadingScreen />}
    </div>
  );
}
