import { RENDER_WIDTH } from "@/config";

export class PerfMonitor {
  visible = false;
  private fpsHistory: number[] = [];
  private lastTime = performance.now();
  private frameCount = 0;
  private currentFps = 0;

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (e.code === "F3") {
        e.preventDefault();
        this.visible = !this.visible;
      }
    });
  }

  update() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  render(ctx: CanvasRenderingContext2D, cacheSize: number) {
    if (!this.visible) return;

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(RENDER_WIDTH - 60, 0, 60, 20);

    ctx.fillStyle = "#00ff00";
    ctx.font = "5px monospace";
    ctx.fillText(`FPS: ${this.currentFps}`, RENDER_WIDTH - 56, 7);
    ctx.fillText(`Cache: ${cacheSize}`, RENDER_WIDTH - 56, 14);
  }
}
