import { Game } from "@/game";
import { RENDER_WIDTH, RENDER_HEIGHT } from "@/config";

function bootstrap() {
  // Display canvas (fills the window)
  const displayCanvas = document.createElement("canvas");
  displayCanvas.style.display = "block";
  displayCanvas.style.imageRendering = "pixelated";
  document.body.appendChild(displayCanvas);

  // Offscreen render canvas at logical resolution
  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = RENDER_WIDTH;
  renderCanvas.height = RENDER_HEIGHT;

  const renderCtx = renderCanvas.getContext("2d")!;
  const displayCtx = displayCanvas.getContext("2d")!;
  displayCtx.imageSmoothingEnabled = false;

  function resize() {
    displayCanvas.width = window.innerWidth;
    displayCanvas.height = window.innerHeight;
    displayCtx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener("resize", resize);

  const game = new Game(renderCtx, displayCanvas);

  let lastTime = 0;
  function frame(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = time;

    game.update(dt);
    game.render();

    // Scale render canvas to display
    displayCtx.fillStyle = "#0a0a0f";
    displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    // Maintain aspect ratio
    const scale = Math.min(
      displayCanvas.width / RENDER_WIDTH,
      displayCanvas.height / RENDER_HEIGHT
    );
    const offsetX = (displayCanvas.width - RENDER_WIDTH * scale) / 2;
    const offsetY = (displayCanvas.height - RENDER_HEIGHT * scale) / 2;

    displayCtx.drawImage(
      renderCanvas,
      0, 0, RENDER_WIDTH, RENDER_HEIGHT,
      offsetX, offsetY, RENDER_WIDTH * scale, RENDER_HEIGHT * scale
    );

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

bootstrap();
