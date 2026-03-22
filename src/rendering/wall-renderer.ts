import {
  RENDER_WIDTH,
  COLOR_WALL,
  COLOR_SHELF,
  PLAYER_HEIGHT,
  VIEW_DISTANCE,
  SHELVES_PER_WALL,
  BOOK_SPINE_COLORS,
  STEPS_PER_FLOOR,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";
import type { WorldGenerator } from "@/generation/world-generator";
import { applyFog } from "@/rendering/fog";
import { BASE_RAILING_X } from "@/rendering/void-renderer";

export interface BookHit {
  worldStep: number;
  floor: number;
  segment: number;
  shelf: number;
  slot: number;
}

// Wall base X position (shifts with angle)
const WALL_MARGIN = 20; // gap between railing and wall

export function renderWall(
  ctx: CanvasRenderingContext2D,
  player: PlayerSystem,
  world: WorldGenerator,
  flicker: number,
  angleShift: number,
  horizonY: number,
  crosshairX: number,
  crosshairY: number
): BookHit | null {
  let hitBook: BookHit | null = null;

  const wallBaseX = BASE_RAILING_X + WALL_MARGIN + angleShift;

  // Render wall strips from far to near (painter's algorithm)
  for (let stepOffset = VIEW_DISTANCE; stepOffset >= -1; stepOffset--) {
    const worldStep = Math.floor(player.position) + stepOffset;
    const relativePos = worldStep - player.position;

    if (relativePos < -0.5 || relativePos > VIEW_DISTANCE) continue;

    const distance = Math.max(0.3, relativePos);

    // Perspective: wall strip height and position
    const stripHeight = Math.round((PLAYER_HEIGHT * 3.5) / distance);
    const stripTop = horizonY - Math.round(stripHeight * 0.55);
    const wallX = wallBaseX;
    const wallWidth = Math.max(1, RENDER_WIDTH - wallX);

    if (wallX >= RENDER_WIDTH || wallX + wallWidth <= 0) continue;

    // Draw wall background
    const [wr, wg, wb] = applyFog(COLOR_WALL.r, COLOR_WALL.g, COLOR_WALL.b, distance, flicker);
    ctx.fillStyle = `rgb(${wr},${wg},${wb})`;
    ctx.fillRect(Math.max(0, wallX), stripTop, wallWidth, stripHeight);

    // Wall edge line
    if (wallX >= 0 && wallX < RENDER_WIDTH) {
      ctx.fillStyle = `rgb(${Math.round(wr * 0.5)},${Math.round(wg * 0.5)},${Math.round(wb * 0.5)})`;
      ctx.fillRect(wallX, stripTop, 1, stripHeight);
    }

    // Shelves and books
    const stepData = world.getStep(worldStep);
    if (!stepData || distance > 12) continue;

    const shelfSpacing = stripHeight / (SHELVES_PER_WALL + 1);

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfY = Math.round(stripTop + shelfSpacing * (s + 1));

      // Shelf plank
      const [sr, sg, sb] = applyFog(COLOR_SHELF.r, COLOR_SHELF.g, COLOR_SHELF.b, distance, flicker);
      const plankHeight = Math.max(1, Math.round(2 / distance));
      ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
      ctx.fillRect(Math.max(0, wallX + 1), shelfY, wallWidth - 2, plankHeight);

      // Books between shelves
      const bookAreaTop = s === 0 ? stripTop + 2 : Math.round(stripTop + shelfSpacing * s) + 2;
      const bookAreaBottom = shelfY - 1;
      const bookHeight = Math.max(1, bookAreaBottom - bookAreaTop);

      if (bookHeight <= 0 || distance > 8) continue;

      const shelfBooks = stepData.shelves[s];
      if (!shelfBooks) continue;

      let bookX = Math.max(0, wallX + 2);
      const bookXEnd = wallX + wallWidth - 2;

      for (let b = 0; b < shelfBooks.length; b++) {
        const book = shelfBooks[b];
        if (!book) continue;

        const bookWidth = Math.max(1, Math.round(book.width / Math.max(1, distance * 0.7)));
        if (bookX + bookWidth > bookXEnd) break;

        const color = BOOK_SPINE_COLORS[book.colorIndex];
        if (!color) continue;

        // Check if crosshair is on this book
        const isUnderCrosshair =
          crosshairX >= bookX &&
          crosshairX < bookX + bookWidth &&
          crosshairY >= bookAreaTop &&
          crosshairY < bookAreaTop + bookHeight;

        let br: number, bg: number, bb: number;
        if (isUnderCrosshair) {
          // Highlight: brighten the book
          [br, bg, bb] = applyFog(
            Math.min(255, color[0]! + 60),
            Math.min(255, color[1]! + 60),
            Math.min(255, color[2]! + 60),
            distance, flicker
          );
          const floor = Math.floor(worldStep / STEPS_PER_FLOOR);
          const segment = ((worldStep % STEPS_PER_FLOOR) + STEPS_PER_FLOOR) % STEPS_PER_FLOOR;
          hitBook = { worldStep, floor, segment, shelf: s, slot: b };
        } else {
          [br, bg, bb] = applyFog(color[0]!, color[1]!, color[2]!, distance, flicker);
        }

        ctx.fillStyle = `rgb(${br},${bg},${bb})`;
        ctx.fillRect(bookX, bookAreaTop, bookWidth, bookHeight);

        bookX += bookWidth + (distance < 3 ? 1 : 0);
      }
    }
  }

  return hitBook;
}
