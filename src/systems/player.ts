import type { InputSystem } from "@/systems/input";
import { RENDER_HEIGHT } from "@/config";
import { isInsideHex, HEX_CX, HEX_CY } from "@/rendering/renderer";

const MOVE_SPEED = 3.5;
const MOUSE_SENSITIVITY = 0.003;

export class PlayerSystem {
  posX = HEX_CX;
  posY = HEX_CY;
  dirX = 1;
  dirY = 0;
  planeX = 0;
  planeY = 0.66;
  pitch = 0;

  update(dt: number, input: InputSystem) {
    const moveSpeed = MOVE_SPEED * dt;

    const mouse = input.consumeMouse();
    if (mouse.dx !== 0) this.rotate(mouse.dx * MOUSE_SENSITIVITY);
    this.pitch -= mouse.dy * 1.5;
    this.pitch = Math.max(-RENDER_HEIGHT / 2, Math.min(RENDER_HEIGHT / 2, this.pitch));

    // W/S forward/back
    const fwd = input.forward;
    if (fwd !== 0) {
      const nx = this.posX + this.dirX * moveSpeed * fwd;
      const ny = this.posY + this.dirY * moveSpeed * fwd;
      if (isInsideHex(nx, this.posY)) this.posX = nx;
      if (isInsideHex(this.posX, ny)) this.posY = ny;
    }

    // A/D strafe
    const strafe = input.strafe;
    if (strafe !== 0) {
      const sx = -this.dirY;
      const sy = this.dirX;
      const nx = this.posX + sx * moveSpeed * 0.7 * strafe;
      const ny = this.posY + sy * moveSpeed * 0.7 * strafe;
      if (isInsideHex(nx, this.posY)) this.posX = nx;
      if (isInsideHex(this.posX, ny)) this.posY = ny;
    }
  }

  private rotate(angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const od = this.dirX;
    this.dirX = this.dirX * cos - this.dirY * sin;
    this.dirY = od * sin + this.dirY * cos;
    const op = this.planeX;
    this.planeX = this.planeX * cos - this.planeY * sin;
    this.planeY = op * sin + this.planeY * cos;
  }
}
