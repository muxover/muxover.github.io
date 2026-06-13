# muxover.github.io

<div align="center">

[![Deploy](https://github.com/muxover/muxover.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/muxover/muxover.github.io/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**An explorable PS1-style portfolio, guided by a duck.**

</div>

---

A small 3D scene rendered in the authentic PlayStation-1 look — low internal resolution, vertex wobble, affine texture warp, Bayer dithering, dense fog, CRT grain. A tired duck waddles you between stations: About, Open Source, Services, Client Work, Stack, Contact, and a live signal terminal — and sulks off to the lamp if you wander the street on your own. Repos and profile numbers are fetched live from the GitHub API at runtime, cached in localStorage, and degrade to a "signal lost" screen when unreachable. Phones (and a "just show me the info" button) get a plain-text version of everything instead.

---

## Quick Start

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production bundle in dist/
```

---

## Configuration

All look/feel tunables live in [src/config.ts](src/config.ts):

| Key | Controls |
|-----|----------|
| `look.renderHeight` | internal render resolution (400p desktop, 280p mobile) |
| `look.snapDivisor` | vertex wobble grid coarseness |
| `look.ditherLevels` | color quantization steps per channel |
| `look.scanlineIntensity`, `grain`, `chromaticAberration`, `vignetteDarkness` | CRT post pass |
| `look.fog*`, `lamp*`, `ambient` | night lighting |
| `look.animFps` | stepped character animation rate |
| `github.hideForks`, `sortBy`, `cacheTtlMin` | live repo fetching |
| `player.*`, `duck.*` | movement speeds, bounds, spawn points |

`prefers-reduced-motion` disables jitter, grain, scanlines and aberration. `?text` opens the plain-text version directly; `?street` forces the 3D scene on a touch device.

---

## Project Layout

```
public/
  logo.png            the duck
  favicon.png         circular crop of the duck
  CNAME               GitHub Pages custom domain
src/
  config.ts           every tunable in one place
  content.ts          stations, copy, duck dialogue, contact links
  store.ts            zustand app state (scene, prompts, data)
  api/github.ts       live GitHub fetch + localStorage cache + fallback
  render/
    psx.ts            PS1 shader: vertex snap, affine UVs, Gouraud, fog
    textures.ts       procedural canvas textures (zero asset payload)
    cards.ts          procedural playing-card faces and back
    PostFX.tsx        Bayer dither + scanlines + grain + vignette + CA
  game/
    input.ts          keyboard / joystick / drag input + persistent state
    blackjack.ts      card game rules and hand state
    Plaza.tsx         buildings, streetlamp, neon, props
    Player.tsx        first-person tank controls + collision
    Duck.tsx          duck model + guide state machine
    Stations.tsx      station props, live CRT screens, proximity
    DenRoom.tsx       the 3D back-room behind the den door
  ui/
    Hud.tsx           prompts, dialogue, skip button
    Panel.tsx         station content panels
    DenHud.tsx        card game controls overlay
    LoadingScreen.tsx NOW LOADING + waddling duck
    TextFallback.tsx  accessible plain-text version
    Joystick.tsx      mobile touch controls
```

---

## License

Licensed under the [MIT](LICENSE) license.

---

## Links

- Site: https://muxover.is-a.dev
- Repository: https://github.com/muxover/muxover.github.io
- Issues: https://github.com/muxover/muxover.github.io/issues

---

<p align="center">Made with ❤️ by Jax (@muxover)</p>
