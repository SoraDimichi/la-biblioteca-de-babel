export class InputSystem {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private scrollDelta = 0;
  private mouseDown = false;
  private _clicked = false;

  constructor(canvas: HTMLCanvasElement) {
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
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    canvas.addEventListener("wheel", (e) => {
      this.scrollDelta += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("mousedown", () => {
      this.mouseDown = true;
      this._clicked = true;
    });
    canvas.addEventListener("mouseup", () => {
      this.mouseDown = false;
    });
  }

  getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) y = -1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) y = 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x = -1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x = 1;

    // Normalize diagonal movement
    const len = Math.sqrt(x * x + y * y);
    if (len > 0) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  getMouseScreen(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  consumeScroll(): number {
    const delta = this.scrollDelta;
    this.scrollDelta = 0;
    return delta;
  }

  consumeClick(): boolean {
    const clicked = this._clicked;
    this._clicked = false;
    return clicked;
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  wasJustPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  endFrame() {
    this.justPressed.clear();
  }
}
