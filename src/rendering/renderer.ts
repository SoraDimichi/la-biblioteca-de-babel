import {
  SHELVES_PER_WALL, BOOK_SPINE_COLORS, STEPS_PER_FLOOR,
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

// --- Hex geometry ---
const HEX_CX = 16;
const HEX_CY = 16;
const HEX_R = 5;

interface WallSeg {
  x1: number; y1: number;
  x2: number; y2: number;
  wallIndex: number;
  nx: number; ny: number;
}

const WALLS: WallSeg[] = [];
const HEX_CORNERS: { x: number; y: number }[] = [];

for (let i = 0; i < 6; i++) {
  const angle = (Math.PI / 3) * i;
  HEX_CORNERS.push({
    x: HEX_CX + HEX_R * Math.cos(angle),
    y: HEX_CY + HEX_R * Math.sin(angle),
  });
}

for (let i = 0; i < 6; i++) {
  const c1 = HEX_CORNERS[i]!;
  const c2 = HEX_CORNERS[(i + 1) % 6]!;
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  let nx = -dy / len;
  let ny = dx / len;
  const midX = (c1.x + c2.x) / 2;
  const midY = (c1.y + c2.y) / 2;
  if ((HEX_CX - midX) * nx + (HEX_CY - midY) * ny < 0) { nx = -nx; ny = -ny; }
  WALLS.push({ x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y, wallIndex: i, nx, ny });
}

function isInsideHex(px: number, py: number): boolean {
  for (const wall of WALLS) {
    const wallDx = wall.x2 - wall.x1;
    const wallDy = wall.y2 - wall.y1;
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
    const dist = ((px - wall.x1) * (-wallDy / wallLen) + (py - wall.y1) * (wallDx / wallLen));
    if (dist < 0.2) return false;
  }
  return true;
}

function raySegIntersect(
  ox: number, oy: number, dx: number, dy: number,
  x1: number, y1: number, x2: number, y2: number
): { t: number; u: number } | null {
  const sx = x2 - x1;
  const sy = y2 - y1;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((x1 - ox) * sy - (y1 - oy) * sx) / denom;
  const u = ((x1 - ox) * dy - (y1 - oy) * dx) / denom;
  if (t < 0.001 || u < 0 || u > 1) return null;
  return { t, u };
}

const FLOOR_H = 3.0;
const VISIBLE_FLOORS = 8;

function getAngleFromCenter(px: number, py: number): number {
  return ((Math.atan2(py - HEX_CY, px - HEX_CX) + Math.PI * 2) % (Math.PI * 2));
}

const WALL_LIGHT: RGB = [61, 43, 31];
const WALL_DARK: RGB = [45, 32, 23];

export class Renderer {
  private flickerTime = 0;
  private flicker = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  constructor() {}

  render(ctx: CanvasRenderingContext2D, w: number, h: number, player: PlayerSystem, world: WorldGenerator) {
    this.flickerTime += 0.016;
    this.flicker = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;
    this.bookUnderCrosshair = null;

    const pitch = Math.round(player.pitch);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

    const playerAngle = getAngleFromCenter(player.posX, player.posY);
    const EYE_H = FLOOR_H * 0.4;
    const playerHeight = player.floor * FLOOR_H + (playerAngle / (Math.PI * 2)) * FLOOR_H + EYE_H;

    // Background
    ctx.fillStyle = `rgb(6,5,8)`;
    ctx.fillRect(0, 0, w, h);

    for (let x = 0; x < w; x++) {
      const cameraX = 2 * x / w - 1;
      const rayDirX = player.dirX + player.planeX * cameraX;
      const rayDirY = player.dirY + player.planeY * cameraX;

      let nearestT = Infinity;
      let nearestWall = -1;
      let nearestU = 0;

      for (let i = 0; i < 6; i++) {
        const wall = WALLS[i]!;
        const hit = raySegIntersect(
          player.posX, player.posY, rayDirX, rayDirY,
          wall.x1, wall.y1, wall.x2, wall.y2
        );
        if (hit && hit.t < nearestT) {
          nearestT = hit.t;
          nearestWall = i;
          nearestU = hit.u;
        }
      }

      if (nearestWall < 0) continue;

      const perpDist = nearestT;
      const scale = h / Math.max(0.01, perpDist);

      const hitX = player.posX + rayDirX * nearestT;
      const hitY = player.posY + rayDirY * nearestT;
      const hitAngle = getAngleFromCenter(hitX, hitY);

      for (let df = -VISIBLE_FLOORS; df <= VISIBLE_FLOORS; df++) {
        const floorNum = player.floor + df;
        const wallBaseHeight = floorNum * FLOOR_H + (hitAngle / (Math.PI * 2)) * FLOOR_H;
        const relativeHeight = wallBaseHeight - playerHeight;

        const wallBottom = relativeHeight;
        const wallTop = relativeHeight + FLOOR_H * 0.95;

        const yBottom = Math.floor(h / 2 - wallBottom * scale + pitch);
        const yTop = Math.floor(h / 2 - wallTop * scale + pitch);

        const drawStart = Math.max(0, yTop);
        const drawEnd = Math.min(h - 1, yBottom);
        if (drawEnd <= drawStart) continue;

        const floorDist = Math.abs(df);
        const totalFog = Math.min(perpDist + floorDist * 2, 20);

        const baseColor = (nearestWall + floorNum) % 2 === 0 ? WALL_LIGHT : WALL_DARK;
        ctx.fillStyle = rgb(this.applyFog(baseColor, totalFog));
        ctx.fillRect(x, drawStart, 1, drawEnd - drawStart + 1);

        if (floorDist <= 3 && perpDist < 10) {
          this.drawColumnBooks(
            ctx, world, x, cx, cy,
            nearestWall, nearestU, floorNum,
            drawStart, drawEnd, perpDist, totalFog
          );
        }
      }
    }

    // Crosshair
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(cx - 4, cy, 9, 1);
    ctx.fillRect(cx, cy - 4, 1, 9);

    this.drawBookTooltip(ctx, cx, cy);
  }

  private drawColumnBooks(
    ctx: CanvasRenderingContext2D,
    world: WorldGenerator,
    x: number, cx: number, cy: number,
    wallIdx: number, wallU: number, floorNum: number,
    drawStart: number, drawEnd: number,
    perpDist: number, fog: number
  ) {
    const wallHeight = drawEnd - drawStart;
    if (wallHeight <= 4) return;

    const worldStep = floorNum * 6 + wallIdx;
    const stepData = world.getStep(worldStep);
    if (!stepData) return;

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfT = (s + 1) / (SHELVES_PER_WALL + 1);
      const shelfY = Math.floor(drawStart + wallHeight * shelfT);

      ctx.fillStyle = rgb(this.applyFog([92, 64, 51], fog));
      ctx.fillRect(x, shelfY, 1, Math.max(1, Math.round(2 / perpDist)));

      const bookT0 = s / (SHELVES_PER_WALL + 1);
      const bookTop = Math.floor(drawStart + wallHeight * bookT0) + 1;
      const bookBot = shelfY - 1;
      const bookH = bookBot - bookTop;
      if (bookH <= 0) continue;

      const shelfBooks = stepData.shelves[s];
      if (!shelfBooks) continue;

      const bookIndex = Math.floor(wallU * shelfBooks.length);
      const book = shelfBooks[Math.min(bookIndex, shelfBooks.length - 1)];
      if (!book) continue;

      const color = BOOK_SPINE_COLORS[book.colorIndex];
      if (!color) continue;

      const isHit = x === cx && cy >= bookTop && cy <= bookBot;

      let drawColor: RGB;
      if (isHit) {
        drawColor = this.applyFog([
          Math.min(255, color[0] + 80),
          Math.min(255, color[1] + 80),
          Math.min(255, color[2] + 80),
        ], fog);
        this.bookUnderCrosshair = {
          worldStep, floor: floorNum, segment: wallIdx, shelf: s, slot: bookIndex,
        };
      } else {
        drawColor = this.applyFog(color, fog);
      }

      ctx.fillStyle = rgb(drawColor);
      ctx.fillRect(x, bookTop, 1, bookH);
    }
  }

  private applyFog(color: RGB, distance: number): RGB {
    const fogFactor = Math.min(1, Math.max(0, distance / 20));
    const brightness = this.flicker * (1 - fogFactor * 0.92);
    return [
      Math.max(0, Math.min(255, Math.round(color[0] * brightness))),
      Math.max(0, Math.min(255, Math.round(color[1] * brightness))),
      Math.max(0, Math.min(255, Math.round(color[2] * brightness))),
    ];
  }

  private drawBookTooltip(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const hit = this.bookUnderCrosshair;
    if (!hit) return;
    ctx.fillStyle = "rgba(212,197,169,0.8)";
    ctx.font = "14px monospace";
    ctx.fillText(`Floor ${hit.floor} · Wall ${hit.segment} · Shelf ${hit.shelf} · Book ${hit.slot}`, cx - 120, cy + 24);
  }
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export { isInsideHex, HEX_CX, HEX_CY, getAngleFromCenter };
