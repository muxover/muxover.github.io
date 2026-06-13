import * as THREE from "three";
import type { Card } from "../game/blackjack";

function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const faceCache = new Map<string, THREE.CanvasTexture>();
let backTex: THREE.CanvasTexture | null = null;

export function cardFaceTex(card: Card): THREE.CanvasTexture {
  const key = card.rank + card.suit;
  const cached = faceCache.get(key);
  if (cached) return cached;

  const red = card.suit === "♥" || card.suit === "♦";
  const ink = red ? "#c0331f" : "#1a1a1a";
  const tex = canvasTex(96, 134, (ctx) => {
    ctx.fillStyle = "#efe9d8";
    ctx.fillRect(0, 0, 96, 134);
    ctx.strokeStyle = "#b8b0a0";
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 90, 128);

    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `bold 26px "VT323", monospace`;
    ctx.fillText(card.rank, 8, 6);
    ctx.font = `22px "VT323", monospace`;
    ctx.fillText(card.suit, 9, 30);

    // big center pip
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `64px "VT323", monospace`;
    ctx.fillText(card.suit, 48, 70);

    // mirrored corner
    ctx.save();
    ctx.translate(96, 134);
    ctx.rotate(Math.PI);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `bold 26px "VT323", monospace`;
    ctx.fillText(card.rank, 8, 6);
    ctx.font = `22px "VT323", monospace`;
    ctx.fillText(card.suit, 9, 30);
    ctx.restore();
  });
  faceCache.set(key, tex);
  return tex;
}

export function cardBackTex(): THREE.CanvasTexture {
  if (backTex) return backTex;
  backTex = canvasTex(96, 134, (ctx) => {
    ctx.fillStyle = "#3a1410";
    ctx.fillRect(0, 0, 96, 134);
    ctx.strokeStyle = "#efe9d8";
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 90, 128);
    ctx.strokeStyle = "#7a2a1e";
    ctx.lineWidth = 2;
    for (let i = -134; i < 96; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 134, 134);
      ctx.stroke();
    }
    ctx.fillStyle = "#e8862f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `40px "VT323", monospace`;
    ctx.fillText("♠", 48, 67);
  });
  return backTex;
}
