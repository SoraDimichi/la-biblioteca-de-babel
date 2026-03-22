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

    // Book mode: A/D flip, Escape closes (browser also releases pointer lock)
    if (this.bookViewer.visible) {
      if (this.input.wasJustPressed("Space")) {
        this.bookViewer.close();
        this.input.consumeClick(); // discard any pending click
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
        // Pointer lock stays active — no cursor needed for book reading
      }
    }

    this.input.endFrame();
  }

  render() {
    const { w, h } = this.getSize();
    const ctx = this.ctx;

    // Always render the tower
    this.renderer.render(ctx, w, h, this.player, this.world, this.lastDt);
    this.hud.render(ctx, w, h, this.player);
    this.perfMonitor.render(ctx, w, h, this.world.cacheSize);

    // When pointer not locked, show crosshair as a visible dot and hint
    if (!this.input.isLocked && !this.bookViewer.visible) {
      // Dim overlay
      ctx.fillStyle = "rgba(10,10,15,0.3)";
      ctx.fillRect(0, 0, w, h);

      const fontSize = Math.max(12, Math.floor(h / 40));
      ctx.fillStyle = "rgba(212,197,169,0.7)";
      ctx.font = `${fontSize}px monospace`;
      const text = "click to look around";
      const tw = ctx.measureText(text).width;
      ctx.fillText(text, (w - tw) / 2, h / 2 + fontSize);
    }
  }
}
