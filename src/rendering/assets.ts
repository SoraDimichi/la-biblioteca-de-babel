import { Graphics } from "pixi.js";

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
