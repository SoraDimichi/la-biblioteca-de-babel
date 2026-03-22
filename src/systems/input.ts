export class InputSystem {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private _clicked = false;
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private locked = false;

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

    // Pointer lock for FPS mouse look
    canvas.addEventListener("click", () => {
      if (!this.locked) {
        canvas.requestPointerLock();
      } else {
        this._clicked = true;
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
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

  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
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

  get isLocked(): boolean {
    return this.locked;
  }

  endFrame() {
    this.justPressed.clear();
  }
}
