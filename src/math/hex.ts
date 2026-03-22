import { HEX_RADIUS } from "@/config";

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexAddress extends HexCoord {
  y: number;
}

// Flat-top hex: width = 2*R, height = sqrt(3)*R
const SQRT3 = Math.sqrt(3);

export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_RADIUS * (3 / 2) * q;
  const y = HEX_RADIUS * SQRT3 * (r + q / 2);
  return { x, y };
}

export function pixelToHex(px: number, py: number): HexCoord {
  const q = (2 / 3) * px / HEX_RADIUS;
  const r = (-1 / 3 * px + SQRT3 / 3 * py) / HEX_RADIUS;
  return hexRound(q, r);
}

function hexRound(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq || 0, r: rr || 0 };
}

const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((d) => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -dq - dr;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

export function hexRing(center: HexCoord, radius: number): HexCoord[] {
  if (radius === 0) return [{ q: center.q, r: center.r }];

  const results: HexCoord[] = [];
  let current = { q: center.q + radius, r: center.r };

  for (let direction = 0; direction < 6; direction++) {
    const dir = HEX_DIRECTIONS[((direction + 2) % 6)]!;
    for (let step = 0; step < radius; step++) {
      results.push({ q: current.q, r: current.r });
      current = { q: current.q + dir.q, r: current.r + dir.r };
    }
  }

  return results;
}

export function hexSpiral(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [{ q: center.q, r: center.r }];
  for (let r = 1; r <= radius; r++) {
    results.push(...hexRing(center, r));
  }
  return results;
}

export function hexKey(coord: HexCoord, y = 0): string {
  return `${coord.q},${coord.r},${y}`;
}

export function flatTopHexCorners(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return corners;
}
