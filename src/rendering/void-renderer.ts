import {
  RENDER_WIDTH,
  RENDER_HEIGHT,
  HORIZON,
  COLOR_VOID,
  COLOR_RAILING,
} from "@/config";
import type { PlayerSystem } from "@/systems/player";

// The void occupies the left portion of the screen (inner edge of spiral)
const VOID_WIDTH = 80; // pixels of screen width for void
const RAILING_X = VOID_WIDTH; // railing position

export function renderVoid(
  ctx: CanvasRenderingContext2D,
  player: PlayerSystem,
  flicker: number
) {
  const horizonY = HORIZON + Math.round(player.headBob);

  // Dark abyss gradient
  for (let x = 0; x < VOID_WIDTH; x++) {
    const t = x / VOID_WIDTH; // 0 at left edge, 1 at railing
    const brightness = t * 0.15 * flicker; // very dark, slightly lighter near railing

    const r = Math.round(COLOR_VOID.r + (COLOR_RAILING.r - COLOR_VOID.r) * t * 0.3);
    const g = Math.round(COLOR_VOID.g + (COLOR_RAILING.g - COLOR_VOID.g) * t * 0.3);
    const b = Math.round(COLOR_VOID.b + (COLOR_RAILING.b - COLOR_VOID.b) * t * 0.3);

    ctx.fillStyle = `rgb(${Math.round(r * brightness + 5)},${Math.round(g * brightness + 5)},${Math.round(b * brightness + 8)})`;
    ctx.fillRect(x, 0, 1, RENDER_HEIGHT);
  }

  // Railing - thin vertical line
  ctx.fillStyle = `rgb(${Math.round(COLOR_RAILING.r * flicker)},${Math.round(COLOR_RAILING.g * flicker)},${Math.round(COLOR_RAILING.b * flicker)})`;
  ctx.fillRect(RAILING_X, 0, 2, RENDER_HEIGHT);

  // Railing horizontal bars
  const barSpacing = 20;
  const barCount = Math.floor(RENDER_HEIGHT / barSpacing);
  for (let i = 0; i < barCount; i++) {
    const barY = (i * barSpacing + Math.round(player.position * 3)) % RENDER_HEIGHT;
    ctx.fillStyle = `rgb(${Math.round(COLOR_RAILING.r * 0.7 * flicker)},${Math.round(COLOR_RAILING.g * 0.7 * flicker)},${Math.round(COLOR_RAILING.b * 0.7 * flicker)})`;
    ctx.fillRect(RAILING_X - 15, barY, 17, 1);
  }

  // Distant light specs in the void (other floors far below)
  const specSeed = Math.floor(player.position * 0.1);
  for (let i = 0; i < 5; i++) {
    const hash = ((specSeed + i * 7) * 2654435761) >>> 0;
    const sx = (hash % VOID_WIDTH) * 0.6;
    const sy = ((hash >> 8) % RENDER_HEIGHT);
    const brightness2 = ((hash >> 16) % 30 + 10) / 255;

    const flickerSpec = Math.sin(player.position * 0.5 + i * 2.1) * 0.5 + 0.5;

    ctx.fillStyle = `rgba(244,164,96,${brightness2 * flickerSpec})`;
    ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
}

export const VOID_SCREEN_WIDTH = VOID_WIDTH;
export const RAILING_SCREEN_X = RAILING_X;
