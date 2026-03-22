import { RENDER_WIDTH, RENDER_HEIGHT, STEPS_PER_FLOOR } from "@/config";
import type { PlayerSystem } from "@/systems/player";

export class HUD {
  private controlsAlpha = 1;
  private timer = 0;

  render(ctx: CanvasRenderingContext2D, player: PlayerSystem) {
    ctx.font = "6px monospace";
    ctx.fillStyle = "#d4c5a9";

    // Position display
    const floor = player.currentFloor;
    const step = Math.floor(player.positionInFloor);
    ctx.fillText(`Floor ${floor} · Step ${step}/${STEPS_PER_FLOOR}`, 4, RENDER_HEIGHT - 4);

    // Controls hint (fades out)
    if (this.controlsAlpha > 0) {
      ctx.globalAlpha = this.controlsAlpha;
      ctx.fillStyle = "#d4c5a9";
      ctx.font = "5px monospace";
      ctx.fillText("W/S Move · Click Book · Esc Close", RENDER_WIDTH / 2 - 60, 8);
      ctx.globalAlpha = 1;
    }
  }

  update(dt: number) {
    this.timer += dt;
    if (this.timer > 8) {
      this.controlsAlpha = Math.max(0, this.controlsAlpha - dt * 0.5);
    }
  }
}
