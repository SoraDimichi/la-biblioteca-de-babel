import { Application, Container } from "pixi.js";
import { initTextures } from "@/rendering/assets";
import { createRoomContainer } from "@/rendering/room-renderer";
import { InputSystem } from "@/systems/input";
import { CameraSystem } from "@/systems/camera";
import { hexToPixel, hexSpiral } from "@/math/hex";

export class Game {
  private world: Container;
  private input: InputSystem;
  private camera: CameraSystem;

  constructor(private app: Application) {
    this.world = new Container();
    this.app.stage.addChild(this.world);

    this.input = new InputSystem(this.app.canvas as HTMLCanvasElement);
    this.camera = new CameraSystem(this.app.screen.width, this.app.screen.height);

    window.addEventListener("resize", () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
    });
  }

  start() {
    initTextures(this.app.renderer);

    // Render a grid of hex rooms for testing
    const hexes = hexSpiral({ q: 0, r: 0 }, 3);
    for (const hex of hexes) {
      const room = createRoomContainer();
      const pixel = hexToPixel(hex.q, hex.r);
      room.position.set(pixel.x, pixel.y);
      this.world.addChild(room);
    }

    this.app.ticker.add(({ deltaTime }) => {
      this.update(deltaTime);
    });
  }

  private update(dt: number) {
    this.camera.update(dt, this.input);

    // Apply camera transform to world container
    this.world.position.set(
      -this.camera.x * this.camera.zoom + this.app.screen.width / 2,
      -this.camera.y * this.camera.zoom + this.app.screen.height / 2
    );
    this.world.scale.set(this.camera.zoom);
  }
}
