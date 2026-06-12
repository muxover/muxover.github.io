import { useMemo } from "react";
import * as THREE from "three";
import { EffectComposer, ChromaticAberration, Noise, Scanline, Vignette } from "@react-three/postprocessing";
import { BlendFunction, Effect } from "postprocessing";
import { CONFIG } from "../config";
import { useStore } from "../store";

// Ordered 4x4 Bayer dither + color quantization — the banded PS1 gradient look.
const DITHER_FRAG = /* glsl */ `
uniform float uLevels;

const mat4 bayer = mat4(
   0.0,  8.0,  2.0, 10.0,
  12.0,  4.0, 14.0,  6.0,
   3.0, 11.0,  1.0,  9.0,
  15.0,  7.0, 13.0,  5.0
) / 16.0;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  ivec2 p = ivec2(mod(uv * resolution, 4.0));
  float threshold = bayer[p.x][p.y] - 0.5;
  vec3 c = inputColor.rgb + threshold / uLevels;
  outputColor = vec4(floor(c * uLevels + 0.5) / uLevels, inputColor.a);
}
`;

class DitherEffect extends Effect {
  constructor(levels: number) {
    super("DitherEffect", DITHER_FRAG, {
      uniforms: new Map([["uLevels", new THREE.Uniform(levels)]]),
    });
  }
}

export function PostFX() {
  const reduced = useStore((s) => s.reduced);
  const touch = useStore((s) => s.touch);
  const chaos = useStore((s) => s.chaos);
  const look = CONFIG.look;

  const dither = useMemo(() => new DitherEffect(look.ditherLevels), [look.ditherLevels]);
  const caOffset = useMemo(
    () => new THREE.Vector2(look.chromaticAberration, look.chromaticAberration),
    [look.chromaticAberration],
  );

  const effects = [<primitive key="dither" object={dither} />];
  if (!reduced && !touch) {
    effects.push(<ChromaticAberration key="ca" offset={caOffset} radialModulation modulationOffset={0.3} />);
  }
  if (!reduced) {
    effects.push(
      <Scanline key="scan" blendFunction={BlendFunction.OVERLAY} density={1.2} opacity={look.scanlineIntensity} />,
      <Noise key="noise" premultiply opacity={chaos ? look.grain * 2.5 : look.grain} />,
    );
  }
  effects.push(<Vignette key="vig" darkness={look.vignetteDarkness} offset={0.26} />);

  return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}
