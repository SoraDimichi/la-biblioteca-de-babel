import {
  SHELVES_PER_WALL, BOOK_SPINE_COLORS,
  type RGB,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";
import type { WorldGenerator } from "@/generation/world-generator";

export interface BookHit {
  worldStep: number;
  floor: number;
  segment: number;
  shelf: number;
  slot: number;
}

// --- Hex geometry (precomputed, flat arrays for speed) ---
const HEX_CX = 16;
const HEX_CY = 16;
const HEX_R = 5;
const HEX_WALLS = 6;

// Wall segments as flat arrays: [x1, y1, x2, y2, nx, ny, sx, sy] per wall
// sx = x2-x1, sy = y2-y1 (precomputed for ray intersection)
const W_X1: number[] = [];
const W_Y1: number[] = [];
const W_SX: number[] = []; // x2 - x1
const W_SY: number[] = []; // y2 - y1
const W_NX: number[] = [];
const W_NY: number[] = [];

{
  const corners: number[][] = [];
  for (let i = 0; i < HEX_WALLS; i++) {
    const a = (Math.PI / 3) * i;
    corners.push([HEX_CX + HEX_R * Math.cos(a), HEX_CY + HEX_R * Math.sin(a)]);
  }
  for (let i = 0; i < HEX_WALLS; i++) {
    const c1 = corners[i]!;
    const c2 = corners[(i + 1) % HEX_WALLS]!;
    const sx = c2[0]! - c1[0]!;
    const sy = c2[1]! - c1[1]!;
    const len = Math.sqrt(sx * sx + sy * sy);
    let nx = -sy / len;
    let ny = sx / len;
    const mx = (c1[0]! + c2[0]!) / 2;
    const my = (c1[1]! + c2[1]!) / 2;
    if ((HEX_CX - mx) * nx + (HEX_CY - my) * ny < 0) { nx = -nx; ny = -ny; }
    W_X1.push(c1[0]!);
    W_Y1.push(c1[1]!);
    W_SX.push(sx);
    W_SY.push(sy);
    W_NX.push(nx);
    W_NY.push(ny);
  }
}

function isInsideHex(px: number, py: number): boolean {
  for (let i = 0; i < HEX_WALLS; i++) {
    if ((px - W_X1[i]!) * W_NX[i]! + (py - W_Y1[i]!) * W_NY[i]! < 0.2) return false;
  }
  return true;
}

function getAngleFromCenter(px: number, py: number): number {
  return ((Math.atan2(py - HEX_CY, px - HEX_CX) + Math.PI * 2) % (Math.PI * 2));
}

const FLOOR_H = 5.0;
const VISIBLE_FLOORS = 8;
const FOG_MAX = 20;
const INV_FOG_MAX = 1 / FOG_MAX;
const WALL_COLORS: RGB[] = [[61, 43, 31], [45, 32, 23]];

export class Renderer {
  private flickerTime = 0;
  private flicker = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  // Reusable ImageData buffer
  private imgData: ImageData | null = null;
  private imgW = 0;
  private imgH = 0;

  private ensureBuffer(w: number, h: number) {
    if (this.imgW !== w || this.imgH !== h) {
      this.imgData = new ImageData(w, h);
      this.imgW = w;
      this.imgH = h;
    }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, player: PlayerSystem, world: WorldGenerator, dt = 0.016) {
    this.flickerTime += dt;
    this.flicker = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;
    this.bookUnderCrosshair = null;

    this.ensureBuffer(w, h);
    const buf = this.imgData!.data;
    const pitch = Math.round(player.pitch);
    const cx = w >> 1;
    const cy = h >> 1;
    const halfH = h >> 1;
    const flicker = this.flicker;

    const playerAngle = getAngleFromCenter(player.posX, player.posY);
    const playerHeight = player.floor * FLOOR_H + (playerAngle / (Math.PI * 2)) * FLOOR_H + FLOOR_H * 0.4;

    // Clear buffer to background color (6, 5, 8)
    for (let i = 0, len = w * h * 4; i < len; i += 4) {
      buf[i] = 6;
      buf[i + 1] = 5;
      buf[i + 2] = 8;
      buf[i + 3] = 255;
    }

    const posX = player.posX;
    const posY = player.posY;
    const dirX = player.dirX;
    const dirY = player.dirY;
    const planeX = player.planeX;
    const planeY = player.planeY;
    const playerFloor = player.floor;
    const invW = 2 / w;

    for (let x = 0; x < w; x++) {
      const cameraX = x * invW - 1;
      const rayDirX = dirX + planeX * cameraX;
      const rayDirY = dirY + planeY * cameraX;

      // Inline ray-segment intersection for all 6 walls
      let nearestT = 1e9;
      let nearestWall = -1;
      let nearestU = 0;

      for (let i = 0; i < HEX_WALLS; i++) {
        const sx = W_SX[i]!;
        const sy = W_SY[i]!;
        const denom = rayDirX * sy - rayDirY * sx;
        if (denom > -1e-10 && denom < 1e-10) continue;
        const dx = W_X1[i]! - posX;
        const dy = W_Y1[i]! - posY;
        const t = (dx * sy - dy * sx) / denom;
        if (t < 0.001 || t >= nearestT) continue;
        const u = (dx * rayDirY - dy * rayDirX) / denom;
        if (u < 0 || u > 1) continue;
        nearestT = t;
        nearestWall = i;
        nearestU = u;
      }

      if (nearestWall < 0) continue;

      const perpDist = nearestT;
      const scale = h / perpDist;
      const hitAngle = getAngleFromCenter(
        posX + rayDirX * nearestT,
        posY + rayDirY * nearestT
      );
      const hitAngleFrac = hitAngle / (Math.PI * 2);

      // Draw multiple floors for this column
      for (let df = -VISIBLE_FLOORS; df <= VISIBLE_FLOORS; df++) {
        const floorNum = playerFloor + df;
        const relH = (floorNum * FLOOR_H + hitAngleFrac * FLOOR_H) - playerHeight;

        const yBot = (halfH - (relH * scale) + pitch) | 0;
        const yTop = (halfH - ((relH + FLOOR_H * 0.95) * scale) + pitch) | 0;

        const drawStart = yTop < 0 ? 0 : yTop;
        const drawEnd = yBot >= h ? h - 1 : yBot;
        if (drawEnd <= drawStart) continue;

        const floorDist = df < 0 ? -df : df;
        const totalFog = perpDist + floorDist * 2;
        const fogClamped = totalFog > FOG_MAX ? 1 : totalFog * INV_FOG_MAX;
        const brightness = flicker * (1 - fogClamped * 0.92);

        const wc = WALL_COLORS[((nearestWall + floorNum) & 1)]!;
        const wr = (wc[0] * brightness) | 0;
        const wg = (wc[1] * brightness) | 0;
        const wb = (wc[2] * brightness) | 0;

        // Fill wall strip directly into pixel buffer
        for (let y = drawStart; y <= drawEnd; y++) {
          const idx = (y * w + x) << 2;
          buf[idx] = wr;
          buf[idx + 1] = wg;
          buf[idx + 2] = wb;
        }

        // Books (only nearby floors and walls)
        if (floorDist <= 3 && perpDist < 10) {
          this.drawColumnBooksPixel(
            buf, w, world, x, cx, cy,
            nearestWall, nearestU, floorNum,
            drawStart, drawEnd, perpDist, brightness
          );
        }
      }
    }

    ctx.putImageData(this.imgData!, 0, 0);

    // Crosshair (drawn with canvas API on top — tiny, not perf-critical)
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(cx - 4, cy, 9, 1);
    ctx.fillRect(cx, cy - 4, 1, 9);

    this.drawBookTooltip(ctx, cx, cy, h);
  }

  private drawColumnBooksPixel(
    buf: Uint8ClampedArray,
    w: number,
    world: WorldGenerator,
    x: number, cx: number, cy: number,
    wallIdx: number, wallU: number, floorNum: number,
    drawStart: number, drawEnd: number,
    perpDist: number, brightness: number
  ) {
    const wallHeight = drawEnd - drawStart;
    if (wallHeight <= 4) return;

    const worldStep = floorNum * HEX_WALLS + wallIdx;
    const stepData = world.getStep(worldStep);
    if (!stepData) return;

    const invShelfCount = 1 / (SHELVES_PER_WALL + 1);

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfT = (s + 1) * invShelfCount;
      const shelfY = (drawStart + wallHeight * shelfT) | 0;

      // Shelf plank pixel
      const shelfBr = brightness * 0.8;
      const sr = (92 * shelfBr) | 0;
      const sg = (64 * shelfBr) | 0;
      const sb = (51 * shelfBr) | 0;
      const plankH = perpDist < 2 ? 2 : 1;
      for (let py = shelfY; py < shelfY + plankH && py <= drawEnd; py++) {
        const idx = (py * w + x) << 2;
        buf[idx] = sr;
        buf[idx + 1] = sg;
        buf[idx + 2] = sb;
      }

      // Book in this shelf at this column
      const bookTop = ((drawStart + wallHeight * s * invShelfCount) | 0) + 1;
      const bookBot = shelfY - 1;
      if (bookBot <= bookTop) continue;

      const shelfBooks = stepData.shelves[s];
      if (!shelfBooks) continue;

      const bookIndex = (wallU * shelfBooks.length) | 0;
      const book = shelfBooks[Math.min(bookIndex, shelfBooks.length - 1)];
      if (!book) continue;

      const color = BOOK_SPINE_COLORS[book.colorIndex];
      if (!color) continue;

      const isHit = x === cx && cy >= bookTop && cy <= bookBot;

      let br: number, bg: number, bb: number;
      if (isHit) {
        br = (Math.min(255, color[0] + 80) * brightness) | 0;
        bg = (Math.min(255, color[1] + 80) * brightness) | 0;
        bb = (Math.min(255, color[2] + 80) * brightness) | 0;
        this.bookUnderCrosshair = {
          worldStep, floor: floorNum, segment: wallIdx, shelf: s, slot: bookIndex,
        };
      } else {
        br = (color[0] * brightness) | 0;
        bg = (color[1] * brightness) | 0;
        bb = (color[2] * brightness) | 0;
      }

      for (let y = bookTop; y <= bookBot; y++) {
        const idx = (y * w + x) << 2;
        buf[idx] = br;
        buf[idx + 1] = bg;
        buf[idx + 2] = bb;
      }
    }
  }

  private drawBookTooltip(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number) {
    const hit = this.bookUnderCrosshair;
    if (!hit) return;
    const fontSize = Math.max(12, Math.floor(h / 40));
    ctx.fillStyle = "rgba(212,197,169,0.8)";
    ctx.font = `${fontSize}px monospace`;
    const text = `Floor ${hit.floor} · Wall ${hit.segment} · Shelf ${hit.shelf} · Book ${hit.slot}`;
    const metrics = ctx.measureText(text);
    ctx.fillText(text, cx - metrics.width / 2, cy + fontSize * 1.5);
  }
}

export { isInsideHex, HEX_CX, HEX_CY, getAngleFromCenter };
