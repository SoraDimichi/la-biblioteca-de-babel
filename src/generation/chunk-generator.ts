import { Graphics } from "pixi.js";
import type { HexAddress } from "@/math/hex";
import { flatTopHexCorners, hexToPixel } from "@/math/hex";
import { HexChunk, LODLevel } from "@/generation/hex-chunk";
import { seedFromAddress } from "@/math/hash";
import { SeededRandom } from "@/math/hash";
import {
  HEX_RADIUS,
  WALL_HEIGHT,
  WALL_COUNT,
  SHELVES_PER_WALL,
  COLOR_FLOOR,
  COLOR_WALL,
  COLOR_SHELF,
  COLOR_RAILING,
} from "@/config";
import { drawWall, drawShelf } from "@/rendering/assets";

export function generateChunk(address: HexAddress, lod: LODLevel): HexChunk {
  const chunk = new HexChunk(address, lod);
  const pixel = hexToPixel(address.q, address.r);
  chunk.container.position.set(pixel.x, pixel.y);

  const seed = seedFromAddress(address.q, address.r, address.y);
  const rng = new SeededRandom(seed);

  // Slight color variation per room
  const colorVariation = rng.nextInt(-8, 8);
  const floorColor = adjustColor(COLOR_FLOOR, colorVariation);

  switch (lod) {
    case LODLevel.FAR:
      renderFar(chunk, floorColor);
      break;
    case LODLevel.MID:
      renderMid(chunk, floorColor);
      break;
    case LODLevel.NEAR:
      renderNear(chunk, floorColor);
      break;
  }

  return chunk;
}

function renderFar(chunk: HexChunk, floorColor: number) {
  const g = new Graphics();
  const corners = flatTopHexCorners(0, 0, HEX_RADIUS);
  g.poly(corners.flatMap((c) => [c.x, c.y]));
  g.fill({ color: floorColor, alpha: 0.6 });
  g.stroke({ color: COLOR_RAILING, width: 0.5, alpha: 0.2 });
  chunk.container.addChild(g);
}

function renderMid(chunk: HexChunk, floorColor: number) {
  const g = new Graphics();
  const corners = flatTopHexCorners(0, 0, HEX_RADIUS);

  // Floor
  g.poly(corners.flatMap((c) => [c.x, c.y]));
  g.fill({ color: floorColor });
  g.stroke({ color: COLOR_RAILING, width: 0.5, alpha: 0.3 });

  // Walls (simplified, no individual books)
  for (let w = 0; w < WALL_COUNT; w++) {
    const c1 = corners[w]!;
    const c2 = corners[(w + 1) % 6]!;
    const isBack = w >= 1 && w <= 3;
    drawWall(g, c1.x, c1.y, c2.x, c2.y, WALL_HEIGHT * 0.5, COLOR_WALL, isBack ? 0.5 : 0.2);
  }

  chunk.container.addChild(g);
}

function renderNear(chunk: HexChunk, floorColor: number) {
  const g = new Graphics();
  const corners = flatTopHexCorners(0, 0, HEX_RADIUS);

  // Floor
  g.poly(corners.flatMap((c) => [c.x, c.y]));
  g.fill({ color: floorColor });
  g.stroke({ color: COLOR_RAILING, width: 1, alpha: 0.3 });

  // Central shaft
  const shaftCorners = flatTopHexCorners(0, 0, HEX_RADIUS * 0.3);
  g.poly(shaftCorners.flatMap((c) => [c.x, c.y]));
  g.fill({ color: 0x050508 });
  g.stroke({ color: COLOR_RAILING, width: 1, alpha: 0.5 });

  // Walls with shelves
  for (let w = 0; w < WALL_COUNT; w++) {
    const c1 = corners[w]!;
    const c2 = corners[(w + 1) % 6]!;
    const isBack = w >= 1 && w <= 3;
    const alpha = isBack ? 0.9 : 0.4;

    drawWall(g, c1.x, c1.y, c2.x, c2.y, WALL_HEIGHT, COLOR_WALL, alpha);

    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelfY = (s + 1) * (WALL_HEIGHT / (SHELVES_PER_WALL + 1));
      drawShelf(g, c1.x, c1.y, c2.x, c2.y, shelfY, COLOR_SHELF);
    }
  }

  chunk.container.addChild(g);
}

function adjustColor(color: number, delta: number): number {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + delta));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + delta));
  const b = Math.max(0, Math.min(255, (color & 0xff) + delta));
  return (r << 16) | (g << 8) | b;
}
