import { Application } from "pixi.js";
import { Game } from "@/game";

async function bootstrap() {
  const app = new Application();
  await app.init({
    background: 0x0a0a0f,
    resizeTo: window,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  document.body.appendChild(app.canvas);

  const game = new Game(app);
  game.start();
}

bootstrap();
