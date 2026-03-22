export class PerfMonitor {
  private visible = false;
  private frameCount = 0;
  private currentFps = 0;
  private lastTime = performance.now();

  toggle() {
    this.visible = !this.visible;
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

  render(ctx: CanvasRenderingContext2D, w: number, _h: number, cacheSize: number) {
    if (!this.visible) return;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(w - 160, 0, 160, 40);
    ctx.fillStyle = "#00ff00";
    ctx.font = "14px monospace";
    ctx.fillText(`FPS: ${this.currentFps}`, w - 150, 16);
    ctx.fillText(`Cache: ${cacheSize}`, w - 150, 34);
  }
}
