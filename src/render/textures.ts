import * as THREE from "three";

// All textures are tiny procedural canvases — crunchy by construction,
// zero asset payload. Nearest filtering everywhere, no mipmaps.

function make(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, alpha = 0.5) {
  for (let i = 0; i < amount; i++) {
    const v = Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * Math.random()})`;
    ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
  }
}

export function asphaltTex(): THREE.CanvasTexture {
  return make(128, 128, (ctx) => {
    ctx.fillStyle = "#3c4441";
    ctx.fillRect(0, 0, 128, 128);
    speckle(ctx, 128, 128, 2600, 0.8);
    // cracks
    ctx.strokeStyle = "rgba(10,14,12,0.5)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = Math.random() * 128;
      let y = Math.random() * 128;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (Math.random() - 0.5) * 30;
        y += (Math.random() - 0.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export function buildingTex(base: string, lit = 0.22): THREE.CanvasTexture {
  return make(128, 128, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);
    speckle(ctx, 128, 128, 1500, 0.6);
    // window grid; a few warm windows glow in the dark
    for (let y = 10; y < 120; y += 22) {
      for (let x = 10; x < 120; x += 20) {
        const on = Math.random() < lit;
        ctx.fillStyle = on
          ? Math.random() < 0.5
            ? "#c98a3a"
            : "#8a6a3a"
          : "#10110f";
        ctx.fillRect(x, y, 10, 13);
        ctx.strokeStyle = "#0a0b0a";
        ctx.strokeRect(x + 0.5, y + 0.5, 10, 13);
      }
    }
  });
}

export function concreteTex(): THREE.CanvasTexture {
  return make(64, 64, (ctx) => {
    ctx.fillStyle = "#4a524e";
    ctx.fillRect(0, 0, 64, 64);
    speckle(ctx, 64, 64, 900, 0.7);
  });
}

export function woodTex(): THREE.CanvasTexture {
  return make(64, 64, (ctx) => {
    ctx.fillStyle = "#4a3826";
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(20,12,6,0.6)";
    for (let y = 4; y < 64; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 64; x += 8) ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
      ctx.stroke();
    }
    speckle(ctx, 64, 64, 300, 0.4);
  });
}

export function puddleTex(): THREE.CanvasTexture {
  const tex = make(64, 64, (ctx) => {
    ctx.fillStyle = "#0d1614";
    ctx.fillRect(0, 0, 64, 64);
    // fake neon reflection smear
    const g = ctx.createRadialGradient(32, 26, 2, 32, 32, 30);
    g.addColorStop(0, "rgba(255,140,50,0.55)");
    g.addColorStop(0.5, "rgba(180,80,30,0.18)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    speckle(ctx, 64, 64, 200, 0.3);
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export interface SignOptions {
  w?: number;
  h?: number;
  fg?: string;
  bg?: string;
  glow?: string;
  fontPx?: number;
}

// Neon / CRT style text on a dark plate, with a canvas shadow as the glow.
export function signTex(lines: string[], o: SignOptions = {}): THREE.CanvasTexture {
  const w = o.w ?? 256;
  const h = o.h ?? 128;
  const tex = make(w, h, (ctx) => {
    ctx.fillStyle = o.bg ?? "#0a0c0b";
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, w, 0.25);
    const fontPx = o.fontPx ?? Math.min(36, Math.floor((h / lines.length) * 0.62));
    ctx.font = `bold ${fontPx}px "VT323", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = o.glow ?? o.fg ?? "#ff7a18";
    ctx.shadowBlur = fontPx * 0.45;
    ctx.fillStyle = o.fg ?? "#ff7a18";
    const step = h / (lines.length + 1);
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, step * (i + 1), w - 12);
    });
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// CRT monitor face: scanline strips + green-ish phosphor text.
export function screenTex(lines: string[], accent = "#7dffb0"): THREE.CanvasTexture {
  const w = 256;
  const h = 192;
  const tex = make(w, h, (ctx) => {
    ctx.fillStyle = "#04110a";
    ctx.fillRect(0, 0, w, h);
    ctx.font = `20px "VT323", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? accent : "#5fae84";
      ctx.fillText(line, 12, 14 + i * 26, w - 24);
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
