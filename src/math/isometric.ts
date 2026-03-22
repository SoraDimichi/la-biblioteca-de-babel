// Dimetric projection for 2.5D view
// X-axis: 30 degrees from horizontal (rightward)
// Y-axis: 30 degrees from horizontal (leftward)
// Z-axis: straight up

const COS30 = Math.cos(Math.PI / 6); // ~0.866
const SIN30 = 0.5;

export function worldToScreen(
  wx: number,
  wy: number,
  wz = 0
): { sx: number; sy: number } {
  const sx = (wx - wy) * COS30;
  const sy = (wx + wy) * SIN30 - wz;
  return { sx, sy };
}

export function screenToWorld(
  sx: number,
  sy: number,
  wz = 0
): { wx: number; wy: number } {
  // Inverse of the projection (assuming known wz)
  const syAdj = sy + wz;
  const wx = (sx / COS30 + syAdj / SIN30) / 2;
  const wy = (syAdj / SIN30 - sx / COS30) / 2;
  return { wx, wy };
}

export function depthSort(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const aScreen = worldToScreen(a.x, a.y);
  const bScreen = worldToScreen(b.x, b.y);
  return aScreen.sy - bScreen.sy;
}
