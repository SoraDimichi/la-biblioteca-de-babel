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

// Map: a hexagonal corridor (approximated as a ring of cells)
// 1 = outer wall (bookshelves), 2 = inner wall (void), 0 = walkable
const MAP_SIZE = 32;
const MAP: number[][] = createMap();

function createMap(): number[][] {
  const m: number[][] = Array.from({ length: MAP_SIZE }, () =>
    Array.from({ length: MAP_SIZE }, () => 1)
  );

  const cx = MAP_SIZE / 2;
  const cy = MAP_SIZE / 2;
  const outerR = 13;
  const innerR = 8;

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= innerR && dist <= outerR) {
        m[y]![x] = 0; // walkable corridor
      } else if (dist > outerR && dist <= outerR + 1) {
        m[y]![x] = 1; // outer wall (bookshelves)
      } else if (dist >= innerR - 1 && dist < innerR) {
        m[y]![x] = 2; // inner wall (void/railing)
      }
    }
  }

  return m;
}

// Wall colors
const WALL_COLORS: Record<number, { light: RGB; dark: RGB }> = {
  1: { light: [61, 43, 31], dark: [42, 30, 22] },   // outer wall (brown wood)
  2: { light: [22, 22, 38], dark: [15, 15, 28] },     // inner wall (dark void)
};

const CX = Math.floor(RENDER_WIDTH / 2);
const CY = Math.floor(RENDER_HEIGHT / 2);

export class Renderer {
  private flickerTime = 0;
  private flicker = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  // Per-column data for book picking: which wall step and distance
  private columnWallStep: (number | null)[] = new Array(RENDER_WIDTH).fill(null);
  private columnWallDist: number[] = new Array(RENDER_WIDTH).fill(0);
  private columnDrawStart: number[] = new Array(RENDER_WIDTH).fill(0);
  private columnDrawEnd: number[] = new Array(RENDER_WIDTH).fill(0);
  private columnSide: number[] = new Array(RENDER_WIDTH).fill(0);
  private columnMapX: number[] = new Array(RENDER_WIDTH).fill(0);
  private columnMapY: number[] = new Array(RENDER_WIDTH).fill(0);
  private columnWallType: number[] = new Array(RENDER_WIDTH).fill(0);

  constructor(private ctx: CanvasRenderingContext2D) {}

  render(player: PlayerSystem, world: WorldGenerator) {
    const ctx = this.ctx;

    this.flickerTime += 0.016;
    this.flicker = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;
    this.bookUnderCrosshair = null;

    const pitchShift = Math.round(player.pitch);

    // Clear with floor/ceiling gradient
    this.drawFloorCeiling(ctx, pitchShift);

    const w = RENDER_WIDTH;
    const h = RENDER_HEIGHT;

    // --- DDA Raycasting (from Lode Vandevenne / ZeroDayArcade) ---
    for (let x = 0; x < w; x++) {
      const cameraX = 2 * x / w - 1;
      const rayDirX = player.dirX + player.planeX * cameraX;
      const rayDirY = player.dirY + player.planeY * cameraX;

      let mapX = Math.floor(player.posX);
      let mapY = Math.floor(player.posY);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let sideDistX: number;
      let sideDistY: number;
      let stepX: number;
      let stepY: number;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (player.posX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - player.posX) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (player.posY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - player.posY) * deltaDistY;
      }

      // DDA
      let hit = 0;
      let side = 0;
      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) {
          hit = 1;
          break;
        }
        const cell = MAP[mapY]?.[mapX] ?? 1;
        if (cell > 0) {
          hit = cell;
        }
      }

      const perpWallDist = side === 0
        ? sideDistX - deltaDistX
        : sideDistY - deltaDistY;

      const lineHeight = Math.floor(h / Math.max(0.01, perpWallDist));
      const pitchShift = Math.round(player.pitch);
      const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + h / 2 + pitchShift));
      const drawEnd = Math.min(h - 1, Math.floor(lineHeight / 2 + h / 2 + pitchShift));

      // Store for book picking
      this.columnWallDist[x] = perpWallDist;
      this.columnDrawStart[x] = drawStart;
      this.columnDrawEnd[x] = drawEnd;
      this.columnSide[x] = side;
      this.columnMapX[x] = mapX;
      this.columnMapY[x] = mapY;
      this.columnWallType[x] = hit;

      // Get wall color
      const wallDef = WALL_COLORS[hit] ?? WALL_COLORS[1]!;
      const baseColor = side === 1 ? wallDef.dark : wallDef.light;

      // Fog based on distance
      const foggedColor = this.applyFog(baseColor, perpWallDist);

      ctx.fillStyle = rgb(foggedColor);
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart + 1);
    }

    // Draw shelves and books on the outer wall (type 1)
    this.drawBookshelves(ctx, player, world);

    // Crosshair at center
    ctx.fillStyle = "rgba(212,197,169,0.5)";
    ctx.fillRect(CX - 4, CY, 9, 1);
    ctx.fillRect(CX, CY - 4, 1, 9);

    this.drawBookTooltip(ctx);
  }

  private drawFloorCeiling(ctx: CanvasRenderingContext2D, pitchShift: number) {
    const horizon = Math.floor(RENDER_HEIGHT / 2 + pitchShift);
    // Ceiling (dark)
    ctx.fillStyle = `rgb(18,16,12)`;
    ctx.fillRect(0, 0, RENDER_WIDTH, Math.max(0, horizon));
    // Floor (stone)
    ctx.fillStyle = `rgb(32,26,18)`;
    ctx.fillRect(0, Math.max(0, horizon), RENDER_WIDTH, RENDER_HEIGHT - horizon);
  }

  private drawBookshelves(ctx: CanvasRenderingContext2D, player: PlayerSystem, world: WorldGenerator) {
    // For each column that hit an outer wall (type 1), draw shelves on top
    for (let x = 0; x < RENDER_WIDTH; x++) {
      if (this.columnWallType[x] !== 1) continue;

      const dist = this.columnWallDist[x]!;
      if (dist > 8) continue; // too far for books

      const drawStart = this.columnDrawStart[x]!;
      const drawEnd = this.columnDrawEnd[x]!;
      const wallHeight = drawEnd - drawStart;
      if (wallHeight <= 0) continue;

      // Determine world step from map position for book data
      const mx = this.columnMapX[x]!;
      const my = this.columnMapY[x]!;
      const worldStep = my * MAP_SIZE + mx; // unique per wall cell

      const stepData = world.getStep(worldStep);
      if (!stepData) continue;

      // Draw shelf planks and books within this 1-pixel column
      const shelfCount = SHELVES_PER_WALL;
      for (let s = 0; s < shelfCount; s++) {
        const shelfT = (s + 1) / (shelfCount + 1);
        const shelfY = Math.floor(drawStart + wallHeight * shelfT);

        // Shelf plank (1 pixel)
        const shelfColor = this.applyFog([92, 64, 51], dist);
        ctx.fillStyle = rgb(shelfColor);
        ctx.fillRect(x, shelfY, 1, Math.max(1, Math.round(1.5 / dist)));

        // Books above the shelf plank
        const bookT0 = s / (shelfCount + 1);
        const bookT1 = shelfT;
        const bookTop = Math.floor(drawStart + wallHeight * bookT0) + 1;
        const bookBot = shelfY - 1;
        const bookH = bookBot - bookTop;
        if (bookH <= 0) continue;

        // Which book is at this column? Use fractional wall position
        const side = this.columnSide[x]!;
        let wallX: number;
        if (side === 0) {
          wallX = player.posY + this.columnWallDist[x]! *
            (player.dirY + player.planeY * (2 * x / RENDER_WIDTH - 1));
        } else {
          wallX = player.posX + this.columnWallDist[x]! *
            (player.dirX + player.planeX * (2 * x / RENDER_WIDTH - 1));
        }
        wallX = wallX - Math.floor(wallX); // 0..1 position along the wall face

        const shelfBooks = stepData.shelves[s];
        if (!shelfBooks) continue;

        const bookIndex = Math.floor(wallX * shelfBooks.length);
        const book = shelfBooks[Math.min(bookIndex, shelfBooks.length - 1)];
        if (!book) continue;

        const color = BOOK_SPINE_COLORS[book.colorIndex];
        if (!color) continue;

        // Check if crosshair is on this book
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
          this.bookUnderCrosshair = {
            worldStep, floor, segment, shelf: s, slot: bookIndex,
          };
        } else {
          drawColor = this.applyFog(color, dist);
        }

        ctx.fillStyle = rgb(drawColor);
        ctx.fillRect(x, bookTop, 1, bookH);
      }
    }
  }

  private applyFog(color: RGB, distance: number): RGB {
    const maxDist = 16;
    const fogFactor = Math.min(1, Math.max(0, distance / maxDist));
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
    ctx.font = "7px monospace";
    ctx.fillText(`Floor ${hit.floor} · Shelf ${hit.shelf} · Book ${hit.slot}`, CX - 50, CY + 16);
  }
}

function rgb(c: RGB): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export { MAP, MAP_SIZE };
