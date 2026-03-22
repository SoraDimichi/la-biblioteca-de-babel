import {
  RENDER_HEIGHT,
  COLOR_VOID,
  COLOR_RAILING,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";

// Base position for the void/railing (shifts with player angle)
const BASE_VOID_WIDTH = 80;
const BASE_RAILING_X = BASE_VOID_WIDTH;

export function renderVoid(
  ctx: CanvasRenderingContext2D,
  player: PlayerSystem,
  flicker: number,
  angleShift: number,
  _horizonY: number
) {
  const railingX = BASE_RAILING_X + angleShift;
  const voidWidth = Math.max(0, railingX);

  if (voidWidth <= 0) return; // void is off-screen (looking far right)

  // Dark abyss gradient
  for (let x = 0; x < voidWidth; x++) {
    const t = x / Math.max(1, voidWidth);
    const brightness = t * 0.15 * flicker;

    const r = Math.round(COLOR_VOID.r + (COLOR_RAILING.r - COLOR_VOID.r) * t * 0.3);
    const g = Math.round(COLOR_VOID.g + (COLOR_RAILING.g - COLOR_VOID.g) * t * 0.3);
    const b = Math.round(COLOR_VOID.b + (COLOR_RAILING.b - COLOR_VOID.b) * t * 0.3);

    ctx.fillStyle = `rgb(${Math.round(r * brightness + 5)},${Math.round(g * brightness + 5)},${Math.round(b * brightness + 8)})`;
    ctx.fillRect(x, 0, 1, RENDER_HEIGHT);
  }

  // Railing vertical line
  if (railingX > 0 && railingX < 320) {
    ctx.fillStyle = `rgb(${Math.round(COLOR_RAILING.r * flicker)},${Math.round(COLOR_RAILING.g * flicker)},${Math.round(COLOR_RAILING.b * flicker)})`;
    ctx.fillRect(railingX, 0, 2, RENDER_HEIGHT);

    // Railing horizontal bars (parallax with movement)
    const barSpacing = 20;
    const barCount = Math.floor(RENDER_HEIGHT / barSpacing) + 1;
    ctx.fillStyle = `rgb(${Math.round(COLOR_RAILING.r * 0.7 * flicker)},${Math.round(COLOR_RAILING.g * 0.7 * flicker)},${Math.round(COLOR_RAILING.b * 0.7 * flicker)})`;
    for (let i = 0; i < barCount; i++) {
      const barY = ((i * barSpacing + Math.round(player.position * 3)) % RENDER_HEIGHT + RENDER_HEIGHT) % RENDER_HEIGHT;
      ctx.fillRect(railingX - 15, barY, 17, 1);
    }
  }

  // Distant light specs in the void
  const specSeed = Math.floor(player.position * 0.1);
  for (let i = 0; i < 5; i++) {
    const hash = ((specSeed + i * 7) * 2654435761) >>> 0;
    const sx = (hash % Math.max(1, voidWidth)) * 0.6;
    const sy = ((hash >> 8) % RENDER_HEIGHT);
    const brightness2 = ((hash >> 16) % 30 + 10) / 255;
    const flickerSpec = Math.sin(player.position * 0.5 + i * 2.1) * 0.5 + 0.5;

    ctx.fillStyle = `rgba(244,164,96,${brightness2 * flickerSpec})`;
    ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
}

export { BASE_RAILING_X };
