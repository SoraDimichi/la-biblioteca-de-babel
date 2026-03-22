export class InputSystem {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private _clicked = false;
  private canvasRect: DOMRect;

  constructor(private canvas: HTMLCanvasElement) {
    this.canvasRect = canvas.getBoundingClientRect();

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
      this.canvasRect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - this.canvasRect.left;
      this.mouseY = e.clientY - this.canvasRect.top;
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

  get mouseNormX(): number {
    if (this.canvasRect.width === 0) return 0;
    return (this.mouseX / this.canvasRect.width) * 2 - 1; // -1 to 1
  }

  get mouseScreenX(): number {
    return this.mouseX;
  }

  get mouseScreenY(): number {
    return this.mouseY;
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
