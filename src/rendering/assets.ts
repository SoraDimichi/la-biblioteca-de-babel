import { Graphics, RenderTexture, type Renderer, Texture } from "pixi.js";
import { HEX_RADIUS, WALL_HEIGHT, SHELF_HEIGHT, COLOR_FLOOR, COLOR_WALL, COLOR_SHELF, COLOR_RAILING } from "@/config";
import { flatTopHexCorners } from "@/math/hex";

let cachedTextures: Record<string, Texture> | null = null;

export function getTextures(): Record<string, Texture> {
  if (!cachedTextures) throw new Error("Textures not initialized. Call initTextures first.");
  return cachedTextures;
}

export function initTextures(renderer: Renderer) {
  if (cachedTextures) return cachedTextures;

  cachedTextures = {
    floor: createFloorTexture(renderer),
    bookSpine: createBookSpineTexture(renderer),
  };

  return cachedTextures;
}

function createFloorTexture(renderer: Renderer): Texture {
  const g = new Graphics();
  const corners = flatTopHexCorners(0, 0, HEX_RADIUS);

  g.poly(corners.flatMap((c) => [c.x, c.y]));
  g.fill({ color: COLOR_FLOOR, alpha: 1 });
  g.stroke({ color: COLOR_RAILING, width: 1, alpha: 0.3 });

  const texture = RenderTexture.create({
    width: HEX_RADIUS * 2 + 4,
    height: Math.ceil(Math.sqrt(3) * HEX_RADIUS) + 4,
  });

  // Offset drawing to center in texture
  g.position.set(HEX_RADIUS + 2, Math.ceil(Math.sqrt(3) * HEX_RADIUS / 2) + 2);
  renderer.render({ container: g, target: texture });
  g.destroy();

  return texture;
}

function createBookSpineTexture(renderer: Renderer): Texture {
  const g = new Graphics();
  g.rect(0, 0, 4, SHELF_HEIGHT - 2);
  g.fill({ color: 0xffffff });

  const texture = RenderTexture.create({ width: 4, height: SHELF_HEIGHT - 2 });
  renderer.render({ container: g, target: texture });
  g.destroy();

  return texture;
}

export function drawHexFloor(g: Graphics, radius: number, color: number, alpha = 1) {
  const corners = flatTopHexCorners(0, 0, radius);
  g.poly(corners.flatMap((c) => [c.x, c.y]));
  g.fill({ color, alpha });
}

export function drawWall(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  height: number,
  color: number,
  alpha = 1
) {
  g.poly([x1, y1, x2, y2, x2, y2 - height, x1, y1 - height]);
  g.fill({ color, alpha });
  g.stroke({ color: 0x000000, width: 0.5, alpha: 0.3 });
}

export function drawShelf(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  shelfY: number,
  color: number
) {
  const thickness = 2;
  g.poly([
    x1, y1 - shelfY,
    x2, y2 - shelfY,
    x2, y2 - shelfY - thickness,
    x1, y1 - shelfY - thickness,
  ]);
  g.fill({ color });
}
