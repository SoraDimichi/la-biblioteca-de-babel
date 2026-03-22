import type { PlayerSystem } from "@/systems/player";

export class HUD {
  render(ctx: CanvasRenderingContext2D, w: number, h: number, player: PlayerSystem) {
    const fontSize = Math.max(12, Math.floor(h / 40));
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "#d4c5a9";
    ctx.fillText(`Floor ${player.floor} · Pos: ${player.posX.toFixed(1)}, ${player.posY.toFixed(1)}`, 10, h - 10);
  }

  update(_dt: number) {}
}
