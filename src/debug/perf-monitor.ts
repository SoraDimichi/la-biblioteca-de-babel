import { RENDER_WIDTH } from "@/config";

export class PerfMonitor {
  visible = false;
  private frameCount = 0;
  private currentFps = 0;
  private lastTime = performance.now();

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
    ctx.fillRect(RENDER_WIDTH - 130, 0, 130, 36);
    ctx.fillStyle = "#00ff00";
    ctx.font = "12px monospace";
    ctx.fillText(`FPS: ${this.currentFps}`, RENDER_WIDTH - 124, 14);
    ctx.fillText(`Cache: ${cacheSize}`, RENDER_WIDTH - 124, 30);
  }
}
