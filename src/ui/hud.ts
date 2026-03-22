import { RENDER_HEIGHT } from "@/config";
import type { PlayerSystem } from "@/systems/player";

export class HUD {
  render(ctx: CanvasRenderingContext2D, player: PlayerSystem) {
    ctx.font = "14px monospace";
    ctx.fillStyle = "#d4c5a9";
    ctx.fillText(`Pos: ${player.posX.toFixed(1)}, ${player.posY.toFixed(1)}`, 10, RENDER_HEIGHT - 10);
  }

  update(_dt: number) {}
}
