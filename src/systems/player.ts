import type { InputSystem } from "@/systems/input";
import { isInsideHex, HEX_CX, HEX_CY, getAngleFromCenter } from "@/rendering/renderer";

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
  floor = 0; // spiral revolution counter
  private prevAngle = 0;

  update(dt: number, input: InputSystem) {
    const moveSpeed = MOVE_SPEED * dt;

    // Mouse look + arrow key rotation
    const mouse = input.consumeMouse();
    const keyRot = input.keyRotation;
    const totalRot = mouse.dx * MOUSE_SENSITIVITY + keyRot * 2.5 * dt;
    if (totalRot !== 0) this.rotate(totalRot);
    this.pitch -= mouse.dy * 1.5;
    this.pitch = Math.max(-400, Math.min(400, this.pitch));

    const oldAngle = getAngleFromCenter(this.posX, this.posY);

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

    // Track floor: detect when player crosses the 0/2π boundary
    const newAngle = getAngleFromCenter(this.posX, this.posY);
    const delta = newAngle - oldAngle;

    // Large negative jump = crossed 0 going clockwise (up)
    if (delta < -Math.PI) {
      this.floor++;
    }
    // Large positive jump = crossed 0 going counter-clockwise (down)
    if (delta > Math.PI) {
      this.floor--;
    }

    this.prevAngle = newAngle;
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
