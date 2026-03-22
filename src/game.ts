import { Application, Container } from "pixi.js";
import { initTextures } from "@/rendering/assets";
import { InputSystem } from "@/systems/input";
import { CameraSystem } from "@/systems/camera";
import { WorldManager } from "@/systems/world-manager";

export class Game {
  private world: Container;
  private input: InputSystem;
  private camera: CameraSystem;
  private worldManager: WorldManager;

  constructor(private app: Application) {
    this.world = new Container();
    this.app.stage.addChild(this.world);

    this.input = new InputSystem(this.app.canvas as HTMLCanvasElement);
    this.camera = new CameraSystem(this.app.screen.width, this.app.screen.height);
    this.worldManager = new WorldManager(this.world);

    window.addEventListener("resize", () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
    });
  }

  start() {
    initTextures(this.app.renderer);

    this.app.ticker.add(({ deltaTime }) => {
      this.update(deltaTime);
    });
  }

  private update(dt: number) {
    this.camera.update(dt, this.input);
    this.worldManager.update(this.camera);

    // Apply camera transform to world container
    this.world.position.set(
      -this.camera.x * this.camera.zoom + this.app.screen.width / 2,
      -this.camera.y * this.camera.zoom + this.app.screen.height / 2
    );
    this.world.scale.set(this.camera.zoom);
  }
}
