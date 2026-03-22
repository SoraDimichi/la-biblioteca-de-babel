import { Game } from "@/game";

const RENDER_SCALE = 0.5; // render at half resolution, scale up

function bootstrap() {
  const displayCanvas = document.createElement("canvas");
  displayCanvas.style.display = "block";
  displayCanvas.style.imageRendering = "pixelated";
  document.body.appendChild(displayCanvas);

  const renderCanvas = document.createElement("canvas");
  const renderCtx = renderCanvas.getContext("2d")!;
  const displayCtx = displayCanvas.getContext("2d")!;
  displayCtx.imageSmoothingEnabled = false;

  let rw = 0;
  let rh = 0;

  function resize() {
    displayCanvas.width = window.innerWidth;
    displayCanvas.height = window.innerHeight;
    rw = Math.floor(window.innerWidth * RENDER_SCALE);
    rh = Math.floor(window.innerHeight * RENDER_SCALE);
    renderCanvas.width = rw;
    renderCanvas.height = rh;
    displayCtx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener("resize", resize);

  const game = new Game(renderCtx, displayCanvas, () => ({ w: rw, h: rh }));

  let lastTime = 0;
  function frame(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    game.update(dt);
    game.render();

    displayCtx.drawImage(renderCanvas, 0, 0, displayCanvas.width, displayCanvas.height);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

bootstrap();
