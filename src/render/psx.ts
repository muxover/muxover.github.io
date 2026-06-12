import * as THREE from "three";
import { CONFIG } from "../config";

// Uniform objects shared by reference across every PSX material so one
// central update (time, lamp flicker, snap grid) hits the whole scene.
export const shared = {
  uTime: { value: 0 },
  uLampFlicker: { value: 1 },
  uSnap: { value: new THREE.Vector2(320, 240) },
  uJitterOn: { value: 1 },
};

const VERT = /* glsl */ `
uniform vec2 uSnap;
uniform float uJitterOn;
uniform float uLampFlicker;
uniform vec3 uLampPos;
uniform vec3 uLampColor;
uniform vec3 uAmbient;
uniform vec3 uMoonColor;
uniform vec3 uMoonDir;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vLight;
varying vec3 vAffine;
varying float vFog;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);

  // Gouraud: one warm point light (the lamp) + faint cool moonlight + ambient
  vec3 toLamp = uLampPos - wp.xyz;
  float d = length(toLamp);
  float atten = 1.0 / (1.0 + 0.09 * d * d);
  float lambLamp = max(dot(n, toLamp / d), 0.0);
  float lambMoon = max(dot(n, -normalize(uMoonDir)), 0.0);
  vLight = uAmbient + uLampColor * lambLamp * atten * uLampFlicker + uMoonColor * lambMoon;

  vec4 mv = viewMatrix * wp;
  vec4 clip = projectionMatrix * mv;

  // PS1 vertex wobble: snap NDC xy to a coarse grid
  if (uJitterOn > 0.5 && clip.w > 0.0) {
    clip.xy = floor(clip.xy / clip.w * uSnap) / uSnap * clip.w;
  }

  vFog = clamp((length(mv.xyz) - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);

  // affine texture mapping: undo perspective correction by interpolating uv*w
  vAffine = vec3(uv * clip.w, clip.w);
  gl_Position = clip;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uEmissive;
uniform float uFlicker;
uniform float uTime;
uniform vec3 uFogColor;
#ifdef USE_MAP
uniform sampler2D uMap;
#endif

varying vec3 vLight;
varying vec3 vAffine;
varying float vFog;

void main() {
  vec2 uv = vAffine.xy / vAffine.z;
  vec3 base = uColor;
  #ifdef USE_MAP
  base *= texture2D(uMap, uv).rgb;
  #endif

  // cheap neon flicker: random brightness dips stepped at 24hz
  float r = fract(sin(floor(uTime * 24.0) * 127.1) * 43758.5453);
  float dip = 0.45 + 0.55 * step(0.18, r);
  vec3 emissive = uEmissive * mix(1.0, dip, uFlicker);

  #ifdef UNLIT
  vec3 col = base * mix(1.0, dip, uFlicker) + emissive;
  #else
  vec3 col = base * vLight + emissive;
  #endif
  col = mix(col, uFogColor, vFog);
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface PSXOptions {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture | null;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  flicker?: boolean;
  // skip lighting entirely — for neon signs and screens that glow on their own
  unlit?: boolean;
  side?: THREE.Side;
}

export function psxMaterial(o: PSXOptions = {}): THREE.ShaderMaterial {
  const emissive = new THREE.Color(o.emissive ?? 0x000000).multiplyScalar(o.emissiveIntensity ?? 1);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      uTime: shared.uTime,
      uLampFlicker: shared.uLampFlicker,
      uSnap: shared.uSnap,
      uJitterOn: shared.uJitterOn,
      uColor: { value: new THREE.Color(o.color ?? 0xffffff) },
      uEmissive: { value: emissive },
      uFlicker: { value: o.flicker ? 1 : 0 },
      uMap: { value: o.map ?? null },
      uFogColor: { value: new THREE.Color(CONFIG.look.fogColor) },
      uFogNear: { value: CONFIG.look.fogNear },
      uFogFar: { value: CONFIG.look.fogFar },
      uLampPos: { value: new THREE.Vector3(...CONFIG.look.lampPos) },
      uLampColor: {
        value: new THREE.Color(CONFIG.look.lampColor).multiplyScalar(CONFIG.look.lampIntensity),
      },
      uAmbient: { value: new THREE.Color(CONFIG.look.ambient) },
      uMoonColor: { value: new THREE.Color(CONFIG.look.moonColor) },
      uMoonDir: { value: new THREE.Vector3(...CONFIG.look.moonDir) },
    },
  });
  mat.defines = {};
  if (o.map) mat.defines.USE_MAP = "";
  if (o.unlit) mat.defines.UNLIT = "";
  return mat;
}

// Swap the texture on an existing PSX material (used when live repo data
// arrives and the monitor screens need repainting).
export function setPSXMap(mat: THREE.ShaderMaterial, map: THREE.Texture) {
  mat.uniforms.uMap.value = map;
  mat.defines = { ...mat.defines, USE_MAP: "" };
  mat.needsUpdate = true;
}
