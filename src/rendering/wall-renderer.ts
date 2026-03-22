import {
  RENDER_WIDTH,
  RENDER_HEIGHT,
  HORIZON,
  COLOR_WALL,
  COLOR_SHELF,
  PLAYER_HEIGHT,
  VIEW_DISTANCE,
  SHELVES_PER_WALL,
  BOOKS_PER_SHELF,
  BOOK_SPINE_COLORS,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";
import type { WorldGenerator } from "@/generation/world-generator";
import { applyFog } from "@/rendering/fog";
import { RAILING_SCREEN_X } from "@/rendering/void-renderer";

// The wall fills from railing to right edge
const WALL_START_X = RAILING_SCREEN_X + 2;
const CORRIDOR_WIDTH = RENDER_WIDTH - WALL_START_X;

// Wall occupies the right portion of the corridor
const WALL_SCREEN_X = WALL_START_X + Math.floor(CORRIDOR_WIDTH * 0.45);
const WALL_SCREEN_WIDTH = RENDER_WIDTH - WALL_SCREEN_X;

export function renderWall(
  ctx: CanvasRenderingContext2D,
  player: PlayerSystem,
  world: WorldGenerator,
  flicker: number
) {
  const horizonY = HORIZON + Math.round(player.headBob);

  // Render wall strips from far to near (painter's algorithm)
  for (let stepOffset = VIEW_DISTANCE; stepOffset >= -2; stepOffset--) {
    const worldStep = Math.floor(player.position) + stepOffset;
    const relativePos = worldStep - player.position;

    if (relativePos < -1) continue;
    if (relativePos > VIEW_DISTANCE) continue;

    const distance = Math.max(0.5, relativePos);

    // Perspective projection for this strip
    const stripHeight = Math.round((PLAYER_HEIGHT * 3) / distance);
    const stripTop = horizonY - Math.round(stripHeight * 0.6);
    const stripBottom = stripTop + stripHeight;

    // Screen X position (strips further away are more centered)
    const perspectiveShift = Math.round(player.lookOffset * 30 / distance);

    // Draw wall background
    const [wr, wg, wb] = applyFog(COLOR_WALL.r, COLOR_WALL.g, COLOR_WALL.b, distance, flicker);
    ctx.fillStyle = `rgb(${wr},${wg},${wb})`;
    ctx.fillRect(WALL_SCREEN_X + perspectiveShift, stripTop, WALL_SCREEN_WIDTH, stripHeight);

    // Wall edge line (perspective depth cue)
    ctx.fillStyle = `rgb(${Math.round(wr * 0.6)},${Math.round(wg * 0.6)},${Math.round(wb * 0.6)})`;
    ctx.fillRect(WALL_SCREEN_X + perspectiveShift, stripTop, 1, stripHeight);

    // Draw shelves and books
    const stepData = world.getStep(worldStep);
    if (!stepData) continue;

    const shelfSpacing = stripHeight / (SHELVES_PER_WALL + 1);

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfY = Math.round(stripTop + shelfSpacing * (s + 1));

      // Shelf plank
      const [sr, sg, sb] = applyFog(COLOR_SHELF.r, COLOR_SHELF.g, COLOR_SHELF.b, distance, flicker);
      ctx.fillStyle = `rgb(${sr},${sg},${sb})`;
      ctx.fillRect(WALL_SCREEN_X + perspectiveShift + 1, shelfY, WALL_SCREEN_WIDTH - 2, Math.max(1, Math.round(2 / distance)));

      // Books between this shelf and the one above
      const bookAreaTop = s === 0 ? stripTop + 2 : Math.round(stripTop + shelfSpacing * s) + 2;
      const bookAreaBottom = shelfY - 1;
      const bookHeight = Math.max(1, bookAreaBottom - bookAreaTop);

      if (bookHeight <= 0 || distance > 10) continue;

      const shelfBooks = stepData.shelves[s];
      if (!shelfBooks) continue;

      const bookAreaWidth = Math.max(1, WALL_SCREEN_WIDTH - 4);
      let bookX = WALL_SCREEN_X + perspectiveShift + 2;

      for (let b = 0; b < shelfBooks.length; b++) {
        const book = shelfBooks[b];
        if (!book) continue;

        const bookWidth = Math.max(1, Math.round(book.width / distance));
        if (bookX + bookWidth > WALL_SCREEN_X + perspectiveShift + bookAreaWidth) break;

        const color = BOOK_SPINE_COLORS[book.colorIndex];
        if (!color) continue;

        const [br, bg, bb] = applyFog(color[0]!, color[1]!, color[2]!, distance, flicker);
        ctx.fillStyle = `rgb(${br},${bg},${bb})`;
        ctx.fillRect(bookX, bookAreaTop, bookWidth, bookHeight);

        bookX += bookWidth + (distance < 3 ? 1 : 0);
      }
    }
  }
}

export { WALL_SCREEN_X, WALL_SCREEN_WIDTH };
