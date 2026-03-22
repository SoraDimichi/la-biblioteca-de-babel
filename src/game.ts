import { Application, Container } from "pixi.js";
import { initTextures } from "@/rendering/assets";
import { InputSystem } from "@/systems/input";
import { CameraSystem } from "@/systems/camera";
import { WorldManager } from "@/systems/world-manager";
import { BookPicker } from "@/systems/book-picker";
import { AnimationSystem } from "@/systems/animation";
import { AtmosphereSystem } from "@/rendering/atmosphere";
import { UIManager } from "@/ui/ui-manager";
import { BookViewer } from "@/ui/book-viewer";
import { HUD } from "@/ui/hud";
import { PerfMonitor } from "@/debug/perf-monitor";

export class Game {
  private world: Container;
  private input: InputSystem;
  private camera: CameraSystem;
  private worldManager: WorldManager;
  private bookPicker: BookPicker;
  private animationSystem: AnimationSystem;
  private atmosphere: AtmosphereSystem;
  private uiManager: UIManager;
  private bookViewer: BookViewer;
  private hud: HUD;
  private perfMonitor: PerfMonitor;

  constructor(private app: Application) {
    this.world = new Container();
    this.app.stage.addChild(this.world);

    this.input = new InputSystem(this.app.canvas as HTMLCanvasElement);
    this.camera = new CameraSystem(this.app.screen.width, this.app.screen.height);
    this.worldManager = new WorldManager(this.world);
    this.bookPicker = new BookPicker();
    this.animationSystem = new AnimationSystem();
    this.uiManager = new UIManager();
    this.bookViewer = new BookViewer(this.app.screen.width, this.app.screen.height);
    this.hud = new HUD(this.app.screen.width, this.app.screen.height);
    this.perfMonitor = new PerfMonitor(this.app);

    // Atmosphere (after world is created)
    this.atmosphere = new AtmosphereSystem(
      this.world,
      this.app.screen.width,
      this.app.screen.height
    );

    // Layer order: world → vignette → HUD → book viewer → perf monitor
    this.app.stage.addChild(this.atmosphere.vignetteContainer);
    this.app.stage.addChild(this.hud.container);
    this.app.stage.addChild(this.bookViewer.container);
    this.app.stage.addChild(this.perfMonitor.container);

    // Wire UI handlers
    this.uiManager.setOpenBookHandler((address) => {
      this.bookViewer.open(address);
    });
    this.uiManager.setCloseBookHandler(() => {
      this.bookViewer.close();
    });

    window.addEventListener("resize", () => {
      const w = this.app.screen.width;
      const h = this.app.screen.height;
      this.camera.resize(w, h);
      this.bookViewer.resize(w, h);
      this.hud.resize(w, h);
      this.atmosphere.resize(w, h);
    });
  }

  start() {
    initTextures(this.app.renderer);

    this.app.ticker.add(({ deltaTime }) => {
      this.update(deltaTime);
    });
  }

  private update(dt: number) {
    // Handle escape to close book viewer
    if (this.uiManager.isReading && this.input.wasJustPressed("Escape")) {
      this.uiManager.closeBook();
      this.input.endFrame();
      return;
    }

    // Handle page flipping when reading
    if (this.uiManager.isReading) {
      if (this.input.wasJustPressed("ArrowRight")) {
        this.bookViewer.flipPage(2);
      }
      if (this.input.wasJustPressed("ArrowLeft")) {
        this.bookViewer.flipPage(-2);
      }
      this.input.endFrame();
      return;
    }

    // Normal exploration mode
    this.camera.update(dt, this.input);
    this.worldManager.update(this.camera);
    this.atmosphere.update(dt);
    this.animationSystem.update(dt);

    // Book picking
    const pickResult = this.bookPicker.update(this.input, this.camera);
    if (pickResult.clicked) {
      this.uiManager.openBook(pickResult.clicked);
    }

    // HUD
    this.hud.update(this.camera, dt);
    this.hud.container.visible = !this.uiManager.isReading;

    // Perf monitor
    this.perfMonitor.update(this.worldManager.chunkCount);

    // Apply camera transform to world container
    this.world.position.set(
      -this.camera.x * this.camera.zoom + this.app.screen.width / 2,
      -this.camera.y * this.camera.zoom + this.app.screen.height / 2
    );
    this.world.scale.set(this.camera.zoom);

    this.input.endFrame();
  }
}
