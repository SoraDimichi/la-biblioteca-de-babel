import { RENDER_WIDTH, RENDER_HEIGHT } from "@/config";

export class InputSystem {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private _clicked = false;

  // Mouse position in render-canvas coordinates (0..RENDER_WIDTH, 0..RENDER_HEIGHT)
  mouseRenderX = RENDER_WIDTH / 2;
  mouseRenderY = RENDER_HEIGHT / 2;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    canvas.addEventListener("mousemove", (e) => {
      // Map display canvas mouse position to render canvas coordinates
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(
        rect.width / RENDER_WIDTH,
        rect.height / RENDER_HEIGHT
      );
      const offsetX = (rect.width - RENDER_WIDTH * scale) / 2;
      const offsetY = (rect.height - RENDER_HEIGHT * scale) / 2;

      this.mouseRenderX = (e.clientX - rect.left - offsetX) / scale;
      this.mouseRenderY = (e.clientY - rect.top - offsetY) / scale;
    });

    canvas.addEventListener("click", () => {
      this._clicked = true;
    });
  }

  get forward(): number {
    let v = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) v += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) v -= 1;
    return v;
  }

  get strafe(): number {
    let v = 0;
    if (this.keys.has("KeyD")) v += 1;
    if (this.keys.has("KeyA")) v -= 1;
    return v;
  }

  get rotateDir(): number {
    let v = 0;
    if (this.keys.has("KeyQ") || this.keys.has("ArrowLeft")) v += 1;
    if (this.keys.has("KeyE") || this.keys.has("ArrowRight")) v -= 1;
    return v;
  }

  consumeClick(): boolean {
    const clicked = this._clicked;
    this._clicked = false;
    return clicked;
  }

  wasJustPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  endFrame() {
    this.justPressed.clear();
  }
}
