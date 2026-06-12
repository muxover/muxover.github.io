// Every look/feel tunable lives here. Colors are pulled from the logo:
// cream duck, warm orange lamplight, dark teal night, heavy grain.

export const CONFIG = {
  user: "muxover",

  look: {
    // internal render height in pixels; width follows the aspect ratio
    renderHeight: 240,
    renderHeightMobile: 200,
    // vertex grid = drawing buffer resolution / snapDivisor (1 = per-pixel snap)
    snapDivisor: 1,
    // color quantization steps per channel (32 ≈ 5 bits)
    ditherLevels: 32,
    scanlineIntensity: 0.14,
    grain: 0.16,
    chromaticAberration: 0.0016,
    vignetteDarkness: 0.78,
    // characters animate at this visual fps
    animFps: 12,
    fogColor: "#0b1512",
    fogNear: 5,
    fogFar: 30,
    ambient: "#22312d",
    moonColor: "#1d2e2a",
    moonDir: [0.35, -1, 0.4] as const,
    lampPos: [0, 4.05, 0] as const,
    lampColor: "#ff9a3c",
    lampIntensity: 7,
  },

  palette: {
    cream: "#e8dcc3",
    beak: "#e8862f",
    ember: "#ff4818",
    neonOrange: "#ff7a18",
    neonRed: "#ff3b30",
    neonTeal: "#3affd4",
    asphalt: "#272e2c",
    concrete: "#3a423f",
    building: "#252c2e",
  },

  github: {
    hideForks: true,
    sortBy: "updated" as "updated" | "stars",
    cacheTtlMin: 45,
    maxScreens: 6,
  },

  player: {
    speed: 3.4,
    turnSpeed: 2.4,
    eyeHeight: 1.45,
    radius: 0.55,
    bounds: { x: 11.0, z: 9.0 },
    start: [0, 8.2] as const, // x, z — yaw 0 faces -z (toward the lamp)
  },

  duck: {
    speed: 1.5,
    lampSpot: [1.3, 0.7] as const, // x, z
    greetRadius: 5.5,
  },
} as const;

// solid props the player can't walk through: [x, z, radius]
export const COLLIDERS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0.5], // streetlamp
  [-8.6, -5.2, 1.1], // about board
  [4.2, -8.2, 1.0], // monitors
  [6.4, -8.2, 1.0],
  [8.6, -8.2, 1.0],
  [9.8, 2.6, 1.1], // vending machine
  [-9.4, 4.6, 1.0], // payphone
  [5.4, 6.4, 1.1], // bench
  [-4.6, 7.2, 0.6], // trash can
  [-9.0, -0.5, 1.0], // stats terminal
];
