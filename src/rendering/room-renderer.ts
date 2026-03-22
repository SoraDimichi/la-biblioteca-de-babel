import { Container, Graphics } from "pixi.js";
import { HEX_RADIUS, WALL_HEIGHT, WALL_COUNT, COLOR_FLOOR, COLOR_WALL, COLOR_SHELF, COLOR_RAILING, SHELF_HEIGHT, SHELVES_PER_WALL } from "@/config";
import { flatTopHexCorners } from "@/math/hex";
import { drawWall, drawShelf } from "@/rendering/assets";

export function createRoomContainer(): Container {
  const container = new Container();

  // Draw floor
  const floorGfx = new Graphics();
  const corners = flatTopHexCorners(0, 0, HEX_RADIUS);
  floorGfx.poly(corners.flatMap((c) => [c.x, c.y]));
  floorGfx.fill({ color: COLOR_FLOOR });
  floorGfx.stroke({ color: COLOR_RAILING, width: 1, alpha: 0.3 });

  // Draw central shaft (smaller hex void)
  const shaftRadius = HEX_RADIUS * 0.3;
  const shaftCorners = flatTopHexCorners(0, 0, shaftRadius);
  floorGfx.poly(shaftCorners.flatMap((c) => [c.x, c.y]));
  floorGfx.fill({ color: 0x050508 });
  floorGfx.stroke({ color: COLOR_RAILING, width: 1, alpha: 0.5 });

  container.addChild(floorGfx);

  // Draw walls with shelves
  const wallGfx = new Graphics();

  for (let w = 0; w < WALL_COUNT; w++) {
    const c1 = corners[w]!;
    const c2 = corners[(w + 1) % 6]!;

    // Back walls (indices 1,2,3) drawn opaque, front walls semi-transparent
    const isBack = w >= 1 && w <= 3;
    const alpha = isBack ? 0.9 : 0.4;

    drawWall(wallGfx, c1.x, c1.y, c2.x, c2.y, WALL_HEIGHT, COLOR_WALL, alpha);

    // Draw shelves on this wall
    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfY = (s + 1) * (WALL_HEIGHT / (SHELVES_PER_WALL + 1));
      drawShelf(wallGfx, c1.x, c1.y, c2.x, c2.y, shelfY, COLOR_SHELF);
    }
  }

  container.addChild(wallGfx);

  return container;
}
