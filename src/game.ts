import { Application } from "pixi.js";

export class Game {
  constructor(private app: Application) {}

  start() {
    this.app.ticker.add(({ deltaTime }) => {
      this.update(deltaTime);
    });
  }

  private update(_dt: number) {
    // Systems will be added in later milestones
  }
}
