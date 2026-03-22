import { RENDER_WIDTH, RENDER_HEIGHT } from "@/config";

export class InputSystem {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private _clicked = false;
  private _mouseDX = 0;
  private locked = false;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

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
      if (this.locked) {
        this._mouseDX += e.movementX;
      }
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
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) v += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) v -= 1;
    return v;
  }

  consumeMouseDX(): number {
    const d = this._mouseDX;
    this._mouseDX = 0;
    return d;
  }

  consumeClick(): boolean {
    const c = this._clicked;
    this._clicked = false;
    return c;
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
