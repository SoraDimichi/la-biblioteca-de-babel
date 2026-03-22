import type { InputSystem } from "@/systems/input";
import { MAP, MAP_SIZE } from "@/rendering/renderer";

const MOVE_SPEED = 3.5;
const MOUSE_SENSITIVITY = 0.003;

export class PlayerSystem {
  posX = 16;
  posY = 5.5;
  dirX = -1;
  dirY = 0;
  planeX = 0;
  planeY = 0.66;

  update(dt: number, input: InputSystem) {
    const moveSpeed = MOVE_SPEED * dt;

    // Mouse rotation
    const mouseDX = input.consumeMouseDX();
    if (mouseDX !== 0) {
      this.rotate(-mouseDX * MOUSE_SENSITIVITY);
    }

    // W/S forward/back
    const fwd = input.forward;
    if (fwd !== 0) {
      const nx = this.posX + this.dirX * moveSpeed * fwd;
      const ny = this.posY + this.dirY * moveSpeed * fwd;
      if (canWalk(nx, this.posY)) this.posX = nx;
      if (canWalk(this.posX, ny)) this.posY = ny;
    }

    // A/D strafe
    const strafe = input.strafe;
    if (strafe !== 0) {
      const sx = -this.dirY;
      const sy = this.dirX;
      const nx = this.posX + sx * moveSpeed * 0.7 * strafe;
      const ny = this.posY + sy * moveSpeed * 0.7 * strafe;
      if (canWalk(nx, this.posY)) this.posX = nx;
      if (canWalk(this.posX, ny)) this.posY = ny;
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

function canWalk(x: number, y: number): boolean {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || mx >= MAP_SIZE || my < 0 || my >= MAP_SIZE) return false;
  return (MAP[my]?.[mx] ?? 1) === 0;
}
