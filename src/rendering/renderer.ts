import { RENDER_WIDTH, RENDER_HEIGHT, COLOR_BG } from "@/config";
import type { PlayerSystem } from "@/systems/player";
import type { WorldGenerator } from "@/generation/world-generator";
import { renderFloorCeiling } from "@/rendering/floor-ceiling";
import { renderWall } from "@/rendering/wall-renderer";
import { renderVoid } from "@/rendering/void-renderer";

export class Renderer {
  private flickerTime = 0;
  private flickerAmount = 1.0;

  constructor(private ctx: CanvasRenderingContext2D) {}

  render(player: PlayerSystem, world: WorldGenerator) {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);

    // Update candle flicker
    this.flickerTime += 0.016;
    this.flickerAmount = 0.97 + Math.sin(this.flickerTime * 2.3) * 0.03;

    // Render layers back to front
    renderFloorCeiling(ctx, player, this.flickerAmount);
    renderVoid(ctx, player, this.flickerAmount);
    renderWall(ctx, player, world, this.flickerAmount);
  }
}
