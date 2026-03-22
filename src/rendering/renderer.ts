import {
  RENDER_WIDTH, RENDER_HEIGHT,
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

// --- Hex geometry: 6 wall segments ---
const HEX_CX = 16;
const HEX_CY = 16;
const HEX_R = 10;

interface WallSeg {
  x1: number; y1: number;
  x2: number; y2: number;
  wallIndex: number; // 0-5
  nx: number; ny: number; // inward-facing normal
}

// Build 6 wall segments (flat-top hex)
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
  // Inward normal: perpendicular to wall, pointing toward center
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Normal pointing inward (toward center)
  let nx = -dy / len;
  let ny = dx / len;
  // Make sure it points toward center
  const midX = (c1.x + c2.x) / 2;
  const midY = (c1.y + c2.y) / 2;
  if ((HEX_CX - midX) * nx + (HEX_CY - midY) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  WALLS.push({ x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y, wallIndex: i, nx, ny });
}

// Collision: check if point is inside the hex
function isInsideHex(px: number, py: number): boolean {
  for (const wall of WALLS) {
    const dx = px - wall.x1;
    const dy = py - wall.y1;
    // Check point is on the inward side of each wall
    const cross = (wall.x2 - wall.x1) * dy - (wall.y2 - wall.y1) * dx;
    // Cross product sign tells which side; must match normal direction
    const dot = dx * wall.nx + dy * wall.ny;
    // Simplified: use the signed distance to the wall line
    const wallDx = wall.x2 - wall.x1;
    const wallDy = wall.y2 - wall.y1;
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
    const dist = ((px - wall.x1) * (-wallDy / wallLen) + (py - wall.y1) * (wallDx / wallLen));
    if (dist < 0) return false;
  }
  return true;
}

// Ray-segment intersection: returns t (distance along ray) or null
function raySegIntersect(
  ox: number, oy: number, dx: number, dy: number,
  x1: number, y1: number, x2: number, y2: number
): { t: number; u: number } | null {
  const sx = x2 - x1;
  const sy = y2 - y1;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const t = ((x1 - ox) * sy - (y1 - oy) * sx) / denom;
  const u = ((x1 - ox) * dy - (y1 - oy) * dx) / denom;

  if (t < 0.001 || u < 0 || u > 1) return null;
  return { t, u };
}

// Floor height: rises from walls (0) to center (peak)
const FLOOR_PEAK = 4.0; // height at center

function getFloorHeight(px: number, py: number): number {
  const dx = px - HEX_CX;
  const dy = py - HEX_CY;
  const distFromCenter = Math.sqrt(dx * dx + dy * dy);
  const t = 1 - Math.min(1, distFromCenter / (HEX_R - 0.5));
  return t * FLOOR_PEAK;
}

// Wall colors: alternate light/dark per wall for depth
const WALL_LIGHT: RGB = [61, 43, 31];
const WALL_DARK: RGB = [45, 32, 23];

const CX = Math.floor(RENDER_WIDTH / 2);
const CY = Math.floor(RENDER_HEIGHT / 2);

export class Renderer {
  private flickerTime = 0;
  private flicker = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  // Per-column data for bookshelf rendering
  private colDist: number[] = new Array(RENDER_WIDTH).fill(0);
  private colStart: number[] = new Array(RENDER_WIDTH).fill(0);
  private colEnd: number[] = new Array(RENDER_WIDTH).fill(0);
  private colWallIdx: number[] = new Array(RENDER_WIDTH).fill(0);
  private colWallU: number[] = new Array(RENDER_WIDTH).fill(0); // 0..1 position along wall

  constructor(private ctx: CanvasRenderingContext2D) {}

  render(player: PlayerSystem, world: WorldGenerator) {
    const ctx = this.ctx;
    this.flickerTime += 0.016;
    this.flicker = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;
    this.bookUnderCrosshair = null;

    const pitch = Math.round(player.pitch);
    const w = RENDER_WIDTH;
    const h = RENDER_HEIGHT;

    // Floor & ceiling — horizon shifts with player height on slope
    const playerH = getFloorHeight(player.posX, player.posY);
    const horizonShift = Math.round(playerH * 15); // higher = see more floor
    const horizon = Math.floor(h / 2 + pitch - horizonShift);
    ctx.fillStyle = `rgb(14,12,10)`;
    ctx.fillRect(0, 0, w, Math.max(0, horizon));
    ctx.fillStyle = `rgb(30,24,17)`;
    ctx.fillRect(0, Math.max(0, horizon), w, h);

    // --- Raycast against hex wall segments ---
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

      if (nearestWall < 0) {
        this.colDist[x] = 999;
        this.colWallIdx[x] = -1;
        continue;
      }

      const perpDist = nearestT;
      const lineHeight = Math.floor(h / Math.max(0.01, perpDist));

      // Floor height at hit point and at player
      const hitX = player.posX + rayDirX * nearestT;
      const hitY = player.posY + rayDirY * nearestT;
      const wallFloorH = getFloorHeight(hitX, hitY);
      const playerFloorH = getFloorHeight(player.posX, player.posY);
      const heightShift = Math.round((wallFloorH - playerFloorH) * lineHeight * 0.4);

      const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + h / 2 + pitch - heightShift));
      const drawEnd = Math.min(h - 1, Math.floor(lineHeight / 2 + h / 2 + pitch - heightShift));

      this.colDist[x] = perpDist;
      this.colStart[x] = drawStart;
      this.colEnd[x] = drawEnd;
      this.colWallIdx[x] = nearestWall;
      this.colWallU[x] = nearestU;

      // Alternate wall shading for depth
      const baseColor = nearestWall % 2 === 0 ? WALL_LIGHT : WALL_DARK;
      ctx.fillStyle = rgb(this.applyFog(baseColor, perpDist));
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart + 1);
    }

    // Bookshelves on all walls
    this.drawBookshelves(ctx, world);

    // Crosshair
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(CX - 4, CY, 9, 1);
    ctx.fillRect(CX, CY - 4, 1, 9);

    this.drawBookTooltip(ctx);
  }

  private drawBookshelves(ctx: CanvasRenderingContext2D, world: WorldGenerator) {
    for (let x = 0; x < RENDER_WIDTH; x++) {
      const wallIdx = this.colWallIdx[x]!;
      if (wallIdx < 0) continue;

      const dist = this.colDist[x]!;
      if (dist > 12) continue;

      const drawStart = this.colStart[x]!;
      const drawEnd = this.colEnd[x]!;
      const wallHeight = drawEnd - drawStart;
      if (wallHeight <= 4) continue;

      const wallU = this.colWallU[x]!; // 0..1 position along this wall segment
      const worldStep = wallIdx; // each wall = one "step" for book data

      const stepData = world.getStep(worldStep);
      if (!stepData) continue;

      for (let s = 0; s < SHELVES_PER_WALL; s++) {
        const shelfT = (s + 1) / (SHELVES_PER_WALL + 1);
        const shelfY = Math.floor(drawStart + wallHeight * shelfT);

        // Shelf plank
        ctx.fillStyle = rgb(this.applyFog([92, 64, 51], dist));
        ctx.fillRect(x, shelfY, 1, Math.max(1, Math.round(2 / dist)));

        // Books
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

        const isHit = x === CX && CY >= bookTop && CY <= bookBot;

        let drawColor: RGB;
        if (isHit) {
          drawColor = this.applyFog([
            Math.min(255, color[0] + 80),
            Math.min(255, color[1] + 80),
            Math.min(255, color[2] + 80),
          ], dist);
          const floor = Math.floor(worldStep / STEPS_PER_FLOOR);
          const segment = ((worldStep % STEPS_PER_FLOOR) + STEPS_PER_FLOOR) % STEPS_PER_FLOOR;
          this.bookUnderCrosshair = { worldStep, floor, segment, shelf: s, slot: bookIndex };
        } else {
          drawColor = this.applyFog(color, dist);
        }

        ctx.fillStyle = rgb(drawColor);
        ctx.fillRect(x, bookTop, 1, bookH);
      }
    }
  }

  private applyFog(color: RGB, distance: number): RGB {
    const fogFactor = Math.min(1, Math.max(0, distance / 20));
    const brightness = this.flicker * (1 - fogFactor * 0.9);
    return [
      Math.max(0, Math.min(255, Math.round(color[0] * brightness))),
      Math.max(0, Math.min(255, Math.round(color[1] * brightness))),
      Math.max(0, Math.min(255, Math.round(color[2] * brightness))),
    ];
  }

  private drawBookTooltip(ctx: CanvasRenderingContext2D) {
    const hit = this.bookUnderCrosshair;
    if (!hit) return;
    ctx.fillStyle = "rgba(212,197,169,0.8)";
    ctx.font = "12px monospace";
    ctx.fillText(`Wall ${hit.worldStep} · Shelf ${hit.shelf} · Book ${hit.slot}`, CX - 70, CY + 20);
  }
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export { isInsideHex, HEX_CX, HEX_CY, getFloorHeight };
