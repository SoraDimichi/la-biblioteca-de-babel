import { Application, Container } from "pixi.js";
import { initTextures } from "@/rendering/assets";
import { InputSystem } from "@/systems/input";
import { CameraSystem } from "@/systems/camera";
import { WorldManager } from "@/systems/world-manager";
import { BookPicker } from "@/systems/book-picker";
import { UIManager, UIState } from "@/ui/ui-manager";
import { BookViewer } from "@/ui/book-viewer";

export class Game {
  private world: Container;
  private input: InputSystem;
  private camera: CameraSystem;
  private worldManager: WorldManager;
  private bookPicker: BookPicker;
  private uiManager: UIManager;
  private bookViewer: BookViewer;

  constructor(private app: Application) {
    this.world = new Container();
    this.app.stage.addChild(this.world);

    this.input = new InputSystem(this.app.canvas as HTMLCanvasElement);
    this.camera = new CameraSystem(this.app.screen.width, this.app.screen.height);
    this.worldManager = new WorldManager(this.world);
    this.bookPicker = new BookPicker();
    this.uiManager = new UIManager();
    this.bookViewer = new BookViewer(this.app.screen.width, this.app.screen.height);

    // Add book viewer on top of world
    this.app.stage.addChild(this.bookViewer.container);

    // Wire UI handlers
    this.uiManager.setOpenBookHandler((address) => {
      this.bookViewer.open(address);
    });
    this.uiManager.setCloseBookHandler(() => {
      this.bookViewer.close();
    });

    window.addEventListener("resize", () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
      this.bookViewer.resize(this.app.screen.width, this.app.screen.height);
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
    if (this.uiManager.isReading && this.input.isKeyDown("Escape")) {
      this.uiManager.closeBook();
      return;
    }

    // Handle page flipping when reading
    if (this.uiManager.isReading) {
      if (this.input.isKeyDown("ArrowRight")) {
        this.bookViewer.flipPage(2);
      }
      if (this.input.isKeyDown("ArrowLeft")) {
        this.bookViewer.flipPage(-2);
      }
      return;
    }

    // Normal exploration mode
    this.camera.update(dt, this.input);
    this.worldManager.update(this.camera);

    // Book picking
    const pickResult = this.bookPicker.update(this.input, this.camera);
    if (pickResult.clicked) {
      this.uiManager.openBook(pickResult.clicked);
    }

    // Apply camera transform to world container
    this.world.position.set(
      -this.camera.x * this.camera.zoom + this.app.screen.width / 2,
      -this.camera.y * this.camera.zoom + this.app.screen.height / 2
    );
    this.world.scale.set(this.camera.zoom);
  }
}
