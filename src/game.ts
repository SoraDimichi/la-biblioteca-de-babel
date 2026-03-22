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
    displayCanvas: HTMLCanvasElement
  ) {
    this.input = new InputSystem(displayCanvas);
    this.player = new PlayerSystem();
    this.world = new WorldGenerator();
    this.renderer = new Renderer(ctx);
    this.bookViewer = new BookViewer();
    this.hud = new HUD();
    this.perfMonitor = new PerfMonitor();
  }

  update(dt: number) {
    this.perfMonitor.update();
    this.hud.update(dt);

    // Book viewer mode
    if (this.bookViewer.visible) {
      if (this.input.wasJustPressed("Escape")) {
        this.bookViewer.close();
      }
      if (this.input.wasJustPressed("ArrowRight")) {
        this.bookViewer.flipPage(2);
      }
      if (this.input.wasJustPressed("ArrowLeft")) {
        this.bookViewer.flipPage(-2);
      }
      this.input.endFrame();
      return;
    }

    // Exploration mode
    this.player.update(dt, this.input);
    this.world.update(0);

    // Click picks the book under cursor
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
    if (this.bookViewer.visible) {
      this.bookViewer.render(this.ctx);
      return;
    }

    this.renderer.render(
      this.player,
      this.world,
      this.input.mouseRenderX,
      this.input.mouseRenderY
    );
    this.hud.render(this.ctx, this.player);
    this.perfMonitor.render(this.ctx, this.world.cacheSize);
  }
}
