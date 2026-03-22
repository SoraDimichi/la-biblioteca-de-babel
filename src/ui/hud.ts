import { RENDER_WIDTH, RENDER_HEIGHT, STEPS_PER_FLOOR } from "@/config";
import type { PlayerSystem } from "@/systems/player";

export class HUD {
  private controlsAlpha = 1;
  private timer = 0;

  render(ctx: CanvasRenderingContext2D, player: PlayerSystem) {
    ctx.font = "7px monospace";
    ctx.fillStyle = "#d4c5a9";

    const floor = player.currentFloor;
    const step = Math.floor(player.positionInFloor);
    ctx.fillText(`Floor ${floor} · Step ${step}`, 6, RENDER_HEIGHT - 6);
  }

  update(dt: number) {
    this.timer += dt;
  }
}
