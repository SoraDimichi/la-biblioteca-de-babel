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

// --- MAP ---
// 0 = walkable, 1 = bookshelf wall, 2 = void/dark wall, 3 = stair wall
const MAP_SIZE = 40;
const MAP: number[][] = [];
const FLOOR_H: number[][] = []; // floor height per cell (0 = ground level)

function initMap() {
  for (let y = 0; y < MAP_SIZE; y++) {
    MAP[y] = new Array(MAP_SIZE).fill(1);
    FLOOR_H[y] = new Array(MAP_SIZE).fill(0);
  }

  const cx = 16;
  const cy = 20;
  const hexR = 9; // hex radius in cells

  // Carve hexagonal room (flat-top hex)
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const dx = x - cx;
      const dy = y - cy;

      // Flat-top hex distance: max(|dx|, (|dx| + |dy|*sqrt(3)) / 2) roughly
      // Use axial hex containment check
      const qf = (2 / 3) * dx;
      const rf = (-1 / 3) * dx + (Math.sqrt(3) / 3) * dy;
      const sf = -qf - rf;
      const hexDist = Math.max(Math.abs(qf), Math.abs(rf), Math.abs(sf));

      if (hexDist < hexR - 1) {
        MAP[y]![x] = 0; // walkable interior
      } else if (hexDist < hexR) {
        MAP[y]![x] = 1; // bookshelf wall
      }
    }
  }

  // Carve diagonal stairway going up-right from hex room
  // Stairs go from roughly (cx+hexR, cy-2) diagonally to (cx+hexR+12, cy-14)
  const stairStartX = cx + hexR - 2;
  const stairStartY = cy - 1;
  const stairLen = 14;
  const stairWidth = 4;

  for (let i = 0; i < stairLen; i++) {
    const baseX = stairStartX + i;
    const baseY = stairStartY - i;

    for (let w = 0; w < stairWidth; w++) {
      const sx = baseX;
      const sy = baseY + w;
      if (sx >= 0 && sx < MAP_SIZE && sy >= 0 && sy < MAP_SIZE) {
        MAP[sy]![sx] = 0; // walkable
        // Triangular step: floor rises with each step
        FLOOR_H[sy]![sx] = i * 0.3;
      }
    }

    // Stair walls on sides
    const wallY1 = baseY - 1;
    const wallY2 = baseY + stairWidth;
    if (wallY1 >= 0 && wallY1 < MAP_SIZE && baseX < MAP_SIZE) {
      MAP[wallY1]![baseX] = 3; // stair wall
      FLOOR_H[wallY1]![baseX] = i * 0.3;
    }
    if (wallY2 >= 0 && wallY2 < MAP_SIZE && baseX < MAP_SIZE) {
      MAP[wallY2]![baseX] = 3; // stair wall
      FLOOR_H[wallY2]![baseX] = i * 0.3;
    }
  }
}

initMap();

// Wall colors by type
const WALL_COLORS: Record<number, { light: RGB; dark: RGB }> = {
  1: { light: [61, 43, 31], dark: [42, 30, 22] },   // bookshelf (wood)
  2: { light: [22, 22, 38], dark: [15, 15, 28] },   // void
  3: { light: [50, 42, 35], dark: [38, 32, 26] },   // stair stone
};

const CX = Math.floor(RENDER_WIDTH / 2);
const CY = Math.floor(RENDER_HEIGHT / 2);

export class Renderer {
  private flickerTime = 0;
  private flicker = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  private colDist: number[] = new Array(RENDER_WIDTH).fill(0);
  private colStart: number[] = new Array(RENDER_WIDTH).fill(0);
  private colEnd: number[] = new Array(RENDER_WIDTH).fill(0);
  private colSide: number[] = new Array(RENDER_WIDTH).fill(0);
  private colMapX: number[] = new Array(RENDER_WIDTH).fill(0);
  private colMapY: number[] = new Array(RENDER_WIDTH).fill(0);
  private colType: number[] = new Array(RENDER_WIDTH).fill(0);

  constructor(private ctx: CanvasRenderingContext2D) {}

  render(player: PlayerSystem, world: WorldGenerator) {
    const ctx = this.ctx;
    this.flickerTime += 0.016;
    this.flicker = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;
    this.bookUnderCrosshair = null;

    const pitch = Math.round(player.pitch);
    const playerFloorH = getFloorHeight(player.posX, player.posY);

    // Background: ceiling + floor
    const horizon = Math.floor(RENDER_HEIGHT / 2 + pitch);
    ctx.fillStyle = `rgb(14,12,10)`;
    ctx.fillRect(0, 0, RENDER_WIDTH, Math.max(0, horizon));
    ctx.fillStyle = `rgb(28,22,16)`;
    ctx.fillRect(0, Math.max(0, horizon), RENDER_WIDTH, RENDER_HEIGHT);

    const w = RENDER_WIDTH;
    const h = RENDER_HEIGHT;

    // --- DDA Raycasting ---
    for (let x = 0; x < w; x++) {
      const cameraX = 2 * x / w - 1;
      const rayDirX = player.dirX + player.planeX * cameraX;
      const rayDirY = player.dirY + player.planeY * cameraX;

      let mapX = Math.floor(player.posX);
      let mapY = Math.floor(player.posY);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let sideDistX: number, sideDistY: number, stepX: number, stepY: number;

      if (rayDirX < 0) { stepX = -1; sideDistX = (player.posX - mapX) * deltaDistX; }
      else { stepX = 1; sideDistX = (mapX + 1 - player.posX) * deltaDistX; }

      if (rayDirY < 0) { stepY = -1; sideDistY = (player.posY - mapY) * deltaDistY; }
      else { stepY = 1; sideDistY = (mapY + 1 - player.posY) * deltaDistY; }

      let hit = 0;
      let side = 0;
      let steps = 0;
      while (hit === 0 && steps < 60) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        steps++;
        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) { hit = 1; break; }
        const cell = MAP[mapY]?.[mapX] ?? 1;
        if (cell > 0) hit = cell;
      }

      const perpDist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
      const wallFloorH = getFloorHeight(mapX, mapY);
      const heightDiff = (wallFloorH - playerFloorH);

      // Wall height in screen pixels
      const lineH = Math.floor(h / Math.max(0.01, perpDist));

      // Shift wall vertically based on floor height difference
      const hShift = Math.round(heightDiff * lineH);
      const drawStart = Math.max(0, Math.floor(-lineH / 2 + h / 2 + pitch - hShift));
      const drawEnd = Math.min(h - 1, Math.floor(lineH / 2 + h / 2 + pitch - hShift));

      this.colDist[x] = perpDist;
      this.colStart[x] = drawStart;
      this.colEnd[x] = drawEnd;
      this.colSide[x] = side;
      this.colMapX[x] = mapX;
      this.colMapY[x] = mapY;
      this.colType[x] = hit;

      const wallDef = WALL_COLORS[hit] ?? WALL_COLORS[1]!;
      const baseColor = side === 1 ? wallDef.dark : wallDef.light;
      ctx.fillStyle = rgb(this.applyFog(baseColor, perpDist));
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart + 1);

      // Draw stair step edges on the floor for stair cells
      if (hit === 3 || (hit === 0 && wallFloorH > 0)) {
        const stepEdgeY = Math.floor(h / 2 + pitch + hShift);
        if (stepEdgeY > 0 && stepEdgeY < h) {
          ctx.fillStyle = rgb(this.applyFog([55, 45, 35], perpDist));
          ctx.fillRect(x, stepEdgeY, 1, 1);
        }
      }
    }

    // Bookshelves (only on type 1 walls)
    this.drawBookshelves(ctx, player, world);

    // Crosshair
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(CX - 4, CY, 9, 1);
    ctx.fillRect(CX, CY - 4, 1, 9);

    this.drawBookTooltip(ctx);
  }

  private drawBookshelves(ctx: CanvasRenderingContext2D, player: PlayerSystem, world: WorldGenerator) {
    for (let x = 0; x < RENDER_WIDTH; x++) {
      if (this.colType[x] !== 1) continue;

      const dist = this.colDist[x]!;
      if (dist > 10) continue;

      const drawStart = this.colStart[x]!;
      const drawEnd = this.colEnd[x]!;
      const wallH = drawEnd - drawStart;
      if (wallH <= 0) continue;

      const mx = this.colMapX[x]!;
      const my = this.colMapY[x]!;
      const worldStep = my * MAP_SIZE + mx;

      const stepData = world.getStep(worldStep);
      if (!stepData) continue;

      for (let s = 0; s < SHELVES_PER_WALL; s++) {
        const shelfT = (s + 1) / (SHELVES_PER_WALL + 1);
        const shelfY = Math.floor(drawStart + wallH * shelfT);

        // Shelf plank
        ctx.fillStyle = rgb(this.applyFog([92, 64, 51], dist));
        ctx.fillRect(x, shelfY, 1, Math.max(1, Math.round(1.5 / dist)));

        // Books
        const bookT0 = s / (SHELVES_PER_WALL + 1);
        const bookTop = Math.floor(drawStart + wallH * bookT0) + 1;
        const bookBot = shelfY - 1;
        const bookH = bookBot - bookTop;
        if (bookH <= 0) continue;

        const side = this.colSide[x]!;
        let wallX: number;
        if (side === 0) {
          wallX = player.posY + dist * (player.dirY + player.planeY * (2 * x / RENDER_WIDTH - 1));
        } else {
          wallX = player.posX + dist * (player.dirX + player.planeX * (2 * x / RENDER_WIDTH - 1));
        }
        wallX = wallX - Math.floor(wallX);

        const shelfBooks = stepData.shelves[s];
        if (!shelfBooks) continue;

        const bookIndex = Math.floor(wallX * shelfBooks.length);
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
    const fogFactor = Math.min(1, Math.max(0, distance / 18));
    const brightness = this.flicker * (1 - fogFactor * 0.92);
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
    ctx.fillText(`Floor ${hit.floor} · Shelf ${hit.shelf} · Book ${hit.slot}`, CX - 70, CY + 20);
  }
}

function getFloorHeight(x: number, y: number): number {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || mx >= MAP_SIZE || my < 0 || my >= MAP_SIZE) return 0;
  return FLOOR_H[my]?.[mx] ?? 0;
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export { MAP, MAP_SIZE, FLOOR_H, getFloorHeight };
