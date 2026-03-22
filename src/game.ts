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

    // Book mode: A/D flip pages, Escape closes
    if (this.bookViewer.visible) {
      // Always want re-lock while book is open (so Escape re-locks immediately)
      this.input.requestLock();
      if (this.input.wasJustPressed("Escape")) {
        this.bookViewer.close();
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

  }
}
