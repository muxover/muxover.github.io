# muxover.github.io

<div align="center">

[![Deploy](https://github.com/muxover/muxover.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/muxover/muxover.github.io/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Personal portfolio as an explorable PS1-style night street, guided by a smoking duck.**

</div>

---

A small 3D scene rendered in the authentic PlayStation-1 look — low internal resolution, vertex wobble, affine texture warp, Bayer dithering, dense fog, CRT grain. A tired duck waddles you between stations: About, Projects, Stack, Contact, and a live stats terminal. Repos and profile numbers are fetched live from the GitHub API at runtime, cached in localStorage, and degrade to a "signal lost" screen when unreachable. A "just show me the info" button collapses everything into a plain-text page.

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
| `look.renderHeight` | internal render resolution (240p desktop, 200p mobile) |
| `look.snapDivisor` | vertex wobble grid coarseness |
| `look.ditherLevels` | color quantization steps per channel |
| `look.scanlineIntensity`, `grain`, `chromaticAberration`, `vignetteDarkness` | CRT post pass |
| `look.fog*`, `lamp*`, `ambient` | night lighting |
| `look.animFps` | stepped character animation rate |
| `github.hideForks`, `sortBy`, `cacheTtlMin` | live repo fetching |
| `player.*`, `duck.*` | movement speeds, bounds, spawn points |

`prefers-reduced-motion` disables jitter, grain, scanlines and aberration. `?text` in the URL opens the plain-text version directly.

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
  store.ts            zustand app state
  api/github.ts       live GitHub fetch + localStorage cache + fallback
  render/
    psx.ts            PS1 shader: vertex snap, affine UVs, Gouraud, fog
    textures.ts       procedural canvas textures (zero asset payload)
    PostFX.tsx        Bayer dither + scanlines + grain + vignette + CA
  game/
    input.ts          keyboard / joystick / drag input state
    Plaza.tsx         buildings, streetlamp, neon, props
    Player.tsx        first-person tank controls + collision
    Duck.tsx          duck model + guide state machine
    Stations.tsx      station props, live CRT screens, proximity
  ui/
    Hud.tsx           prompts, dialogue, skip button
    Panel.tsx         station content panels
    Blackjack.tsx     a card game. find it in-world.
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
