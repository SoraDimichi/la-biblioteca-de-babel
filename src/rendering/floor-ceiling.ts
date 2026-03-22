import {
  RENDER_WIDTH,
  RENDER_HEIGHT,
  COLOR_FLOOR,
  COLOR_CEILING,
  PLAYER_HEIGHT,
  VIEW_DISTANCE,
  FOG_START,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";

export function renderFloorCeiling(
  ctx: CanvasRenderingContext2D,
  player: PlayerSystem,
  flicker: number,
  horizonY: number
) {
  // Floor (below horizon)
  for (let y = Math.max(0, horizonY + 1); y < RENDER_HEIGHT; y++) {
    const rowDistance = PLAYER_HEIGHT / (y - horizonY);
    if (rowDistance <= 0 || rowDistance > VIEW_DISTANCE) continue;

    const fogFactor = getFogFactor(rowDistance);
    const brightness = flicker * (1 - fogFactor * 0.9);

    const stripe = Math.floor(rowDistance * 2 + player.position * 2) % 2;
    const variation = stripe === 0 ? 0 : -8;

    const r = clamp(Math.round((COLOR_FLOOR.r + variation) * brightness));
    const g = clamp(Math.round((COLOR_FLOOR.g + variation) * brightness));
    const b = clamp(Math.round((COLOR_FLOOR.b + variation) * brightness));

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, RENDER_WIDTH, 1);
  }

  // Ceiling (above horizon)
  for (let y = Math.min(RENDER_HEIGHT - 1, horizonY - 1); y >= 0; y--) {
    const rowDistance = PLAYER_HEIGHT / (horizonY - y);
    if (rowDistance <= 0 || rowDistance > VIEW_DISTANCE) continue;

    const fogFactor = getFogFactor(rowDistance);
    const brightness = flicker * (1 - fogFactor * 0.95);

    const r = clamp(Math.round(COLOR_CEILING.r * brightness));
    const g = clamp(Math.round(COLOR_CEILING.g * brightness));
    const b = clamp(Math.round(COLOR_CEILING.b * brightness));

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, RENDER_WIDTH, 1);
  }
}

function getFogFactor(distance: number): number {
  const fogStart = VIEW_DISTANCE * FOG_START;
  if (distance <= fogStart) return 0;
  return Math.min(1, (distance - fogStart) / (VIEW_DISTANCE - fogStart));
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}
