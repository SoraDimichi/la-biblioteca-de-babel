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
    this.perfMonitor.update();

    if (this.bookViewer.visible) {
      if (this.input.wasJustPressed("Escape")) this.bookViewer.close();
      if (this.input.wasJustPressed("ArrowRight")) this.bookViewer.flipPage(2);
      if (this.input.wasJustPressed("ArrowLeft")) this.bookViewer.flipPage(-2);
      this.input.endFrame();
      return;
    }

    this.player.update(dt, this.input);
    this.world.update(0);

    if (this.input.consumeClick()) {
      const hit = this.renderer.bookUnderCrosshair;
      if (hit) {
        const addr = bookAddressFromWorldStep(hit.worldStep, hit.shelf, hit.slot);
        this.bookViewer.open(addr);
      }
    }

    this.input.endFrame();
  }

  render() {
    const { w, h } = this.getSize();
    const ctx = this.ctx;

    if (this.bookViewer.visible) {
      this.bookViewer.render(ctx, w, h);
      return;
    }

    this.renderer.render(ctx, w, h, this.player, this.world);
    this.hud.render(ctx, w, h, this.player);
    this.perfMonitor.render(ctx, w, h, this.world.cacheSize);

    if (!this.input.isLocked) {
      ctx.fillStyle = "rgba(10,10,15,0.6)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d4c5a9";
      ctx.font = `${Math.floor(h / 30)}px monospace`;
      ctx.fillText("Click to enter the Library", w / 2 - w * 0.12, h / 2);
      ctx.font = `${Math.floor(h / 45)}px monospace`;
      ctx.fillText("WASD move · Mouse look · Click book · Esc exit", w / 2 - w * 0.17, h / 2 + h * 0.04);
    }
  }
}
