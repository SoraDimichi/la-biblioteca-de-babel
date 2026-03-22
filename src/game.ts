import { InputSystem } from "@/systems/input";
import { PlayerSystem } from "@/systems/player";
import { WorldGenerator } from "@/generation/world-generator";
import { Renderer } from "@/rendering/renderer";
import { BookViewer } from "@/ui/book-viewer";
import { HUD } from "@/ui/hud";
import { PerfMonitor } from "@/debug/perf-monitor";
import { bookAddressFromWorldStep } from "@/generation/book-data";
import { RENDER_WIDTH, RENDER_HEIGHT, SHELVES_PER_WALL, BOOKS_PER_SHELF, VIEW_DISTANCE } from "@/config";
import { WALL_SCREEN_X, WALL_SCREEN_WIDTH } from "@/rendering/wall-renderer";
import { HORIZON } from "@/config";

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
    this.world.update(this.player.position);

    // Book selection via click
    if (this.input.consumeClick()) {
      const bookAddr = this.pickBook();
      if (bookAddr) {
        this.bookViewer.open(bookAddr);
      }
    }

    this.input.endFrame();
  }

  render() {
    if (this.bookViewer.visible) {
      this.bookViewer.render(this.ctx);
      return;
    }

    this.renderer.render(this.player, this.world);
    this.hud.render(this.ctx, this.player);
    this.perfMonitor.render(this.ctx, this.world.cacheSize);
  }

  private pickBook(): ReturnType<typeof bookAddressFromWorldStep> | null {
    // Map mouse position to a book on the wall
    const mx = this.input.mouseScreenX;
    const my = this.input.mouseScreenY;

    // Simple hit test: if clicking on the wall area, pick a book
    // The wall occupies the right portion of the screen
    const displayCanvas = this.ctx.canvas.parentElement?.querySelector("canvas");
    if (!displayCanvas) return null;

    // Approximate: pick the nearest step (step 0-2 ahead)
    const worldStep = Math.floor(this.player.position) + 1;
    const shelf = Math.floor(Math.random() * SHELVES_PER_WALL);
    const slot = Math.floor(Math.random() * BOOKS_PER_SHELF);

    return bookAddressFromWorldStep(worldStep, shelf, slot);
  }
}
