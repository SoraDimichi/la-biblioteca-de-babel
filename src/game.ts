import { Application, Container } from "pixi.js";
import { initTextures } from "@/rendering/assets";
import { createRoomContainer } from "@/rendering/room-renderer";

export class Game {
  private world: Container;

  constructor(private app: Application) {
    this.world = new Container();
    this.app.stage.addChild(this.world);
  }

  start() {
    initTextures(this.app.renderer);

    // Render a single hex room at center
    const room = createRoomContainer();
    room.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.world.addChild(room);

    this.app.ticker.add(({ deltaTime }) => {
      this.update(deltaTime);
    });
  }

  private update(_dt: number) {
    // Systems will be added in later milestones
  }
}
