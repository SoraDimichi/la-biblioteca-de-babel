import { Game } from "@/game";

function bootstrap() {
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;

  let renderWidth = 0;
  let renderHeight = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    renderWidth = Math.floor(window.innerWidth * dpr);
    renderHeight = Math.floor(window.innerHeight * dpr);
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  resize();
  window.addEventListener("resize", resize);

  const game = new Game(ctx, canvas, () => ({ w: renderWidth, h: renderHeight }));

  let lastTime = 0;
  function frame(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    game.update(dt);
    game.render();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

bootstrap();
