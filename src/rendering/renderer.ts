import { RENDER_WIDTH, RENDER_HEIGHT, HORIZON, COLOR_BG } from "@/config";
import type { PlayerSystem } from "@/systems/player";
import type { WorldGenerator } from "@/generation/world-generator";
import { renderFloorCeiling } from "@/rendering/floor-ceiling";
import { renderWall, type BookHit } from "@/rendering/wall-renderer";
import { renderVoid } from "@/rendering/void-renderer";

const CROSSHAIR_X = Math.floor(RENDER_WIDTH / 2);
const CROSSHAIR_Y = Math.floor(RENDER_HEIGHT / 2);

export class Renderer {
  private flickerTime = 0;
  private flickerAmount = 1.0;
  bookUnderCrosshair: BookHit | null = null;

  constructor(private ctx: CanvasRenderingContext2D) {}

  render(player: PlayerSystem, world: WorldGenerator) {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    // Horizon shifts with pitch (look up = horizon goes down, look down = goes up)
    const horizonY = Math.round(HORIZON - player.pitch * 80 + player.headBob);

    // Update candle flicker
    this.flickerTime += 0.016;
    this.flickerAmount = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;

    // Horizontal offset from player angle (looking left/right shifts the scene)
    const angleShift = Math.round(-player.angle * 100);

    // Render layers
    renderFloorCeiling(ctx, player, this.flickerAmount, horizonY);
    renderVoid(ctx, player, this.flickerAmount, angleShift, horizonY);
    this.bookUnderCrosshair = renderWall(ctx, player, world, this.flickerAmount, angleShift, horizonY, CROSSHAIR_X, CROSSHAIR_Y);

    // Draw crosshair
    ctx.fillStyle = "rgba(212,197,169,0.6)";
    ctx.fillRect(CROSSHAIR_X - 3, CROSSHAIR_Y, 7, 1);
    ctx.fillRect(CROSSHAIR_X, CROSSHAIR_Y - 3, 1, 7);

    // Highlight hovered book info
    if (this.bookUnderCrosshair) {
      ctx.fillStyle = "rgba(212,197,169,0.8)";
      ctx.font = "5px monospace";
      ctx.fillText(
        `Floor ${this.bookUnderCrosshair.floor} · Shelf ${this.bookUnderCrosshair.shelf} · Book ${this.bookUnderCrosshair.slot}`,
        CROSSHAIR_X - 40, CROSSHAIR_Y + 12
      );
    }
  }
}
