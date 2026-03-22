import { InputSystem } from "@/systems/input";
import { PlayerSystem } from "@/systems/player";
import { WorldGenerator } from "@/generation/world-generator";
import { Renderer } from "@/rendering/renderer";
import { BookViewer } from "@/ui/book-viewer";
import { HUD } from "@/ui/hud";
import { PerfMonitor } from "@/debug/perf-monitor";
import { bookAddressFromWorldStep } from "@/generation/book-data";

export class Game {
  private input: InputSystem;
  private player: PlayerSystem;
  private world: WorldGenerator;
  private renderer: Renderer;
  private bookViewer: BookViewer;
  private hud: HUD;
  private perfMonitor: PerfMonitor;
  private lastDt = 0.016;

  constructor(
    private ctx: CanvasRenderingContext2D,
    displayCanvas: HTMLCanvasElement,
    private getSize: () => { w: number; h: number }
  ) {
    this.input = new InputSystem(displayCanvas);
    this.player = new PlayerSystem();
    this.world = new WorldGenerator();
    this.renderer = new Renderer();
    this.bookViewer = new BookViewer();
    this.hud = new HUD();
    this.perfMonitor = new PerfMonitor();
  }

  update(dt: number) {
    this.lastDt = dt;
    this.perfMonitor.update();

    if (this.input.wasJustPressed("F3")) this.perfMonitor.toggle();

    // Book mode: A/D flip pages, Escape closes and re-locks pointer
    if (this.bookViewer.visible) {
      if (this.input.wasJustPressed("Escape")) {
        this.bookViewer.close();
        this.input.requestLock();
      }
      if (this.input.wasJustPressed("KeyD")) this.bookViewer.flipPage(2);
      if (this.input.wasJustPressed("KeyA")) this.bookViewer.flipPage(-2);
      this.input.endFrame();
      return;
    }

    // Tower mode
    this.player.update(dt, this.input);

    if (this.input.consumeClick()) {
      const hit = this.renderer.bookUnderCrosshair;
      if (hit) {
        const addr = bookAddressFromWorldStep(hit.worldStep, hit.shelf, hit.slot);
        this.bookViewer.open(addr);
        document.exitPointerLock();
      }
    }

    this.input.endFrame();
  }

  render() {
    const { w, h } = this.getSize();
    const ctx = this.ctx;

    // Always render the tower (visible behind book overlay)
    this.renderer.render(ctx, w, h, this.player, this.world, this.lastDt);
    this.hud.render(ctx, w, h, this.player);
    this.perfMonitor.render(ctx, w, h, this.world.cacheSize);

    if (!this.input.isLocked && !this.bookViewer.visible) {
      ctx.fillStyle = "rgba(10,10,15,0.6)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d4c5a9";
      const titleSize = Math.max(14, Math.floor(h / 25));
      ctx.font = `${titleSize}px monospace`;
      const title = "Click to enter the Library";
      const titleW = ctx.measureText(title).width;
      ctx.fillText(title, (w - titleW) / 2, h / 2);
      const subSize = Math.max(10, Math.floor(h / 40));
      ctx.font = `${subSize}px monospace`;
      const sub = "WASD move · Mouse look · Click book · Esc exit";
      const subW = ctx.measureText(sub).width;
      ctx.fillText(sub, (w - subW) / 2, h / 2 + titleSize * 1.5);
    }
  }
}
