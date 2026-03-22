import type { InputSystem } from "@/systems/input";
import { MAP, MAP_SIZE } from "@/rendering/renderer";

const MOVE_SPEED = 3.5;
const ROT_SPEED = 2.5; // radians per second for keyboard rotation

export class PlayerSystem {
  posX = 16;
  posY = 5.5;

  dirX = -1;
  dirY = 0;

  planeX = 0;
  planeY = 0.66;

  update(dt: number, input: InputSystem) {
    const moveSpeed = MOVE_SPEED * dt;

    // --- Keyboard rotation (Q/E or arrow left/right) ---
    const rotDir = input.rotateDir;
    if (rotDir !== 0) {
      const rotAngle = rotDir * ROT_SPEED * dt;
      const cos = Math.cos(rotAngle);
      const sin = Math.sin(rotAngle);

      const oldDirX = this.dirX;
      this.dirX = this.dirX * cos - this.dirY * sin;
      this.dirY = oldDirX * sin + this.dirY * cos;

      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * cos - this.planeY * sin;
      this.planeY = oldPlaneX * sin + this.planeY * cos;
    }

    // --- W/S: move forward/backward ---
    const fwd = input.forward;
    if (fwd !== 0) {
      const nx = this.posX + this.dirX * moveSpeed * fwd;
      const ny = this.posY + this.dirY * moveSpeed * fwd;
      if (this.canWalk(nx, this.posY)) this.posX = nx;
      if (this.canWalk(this.posX, ny)) this.posY = ny;
    }

    // --- A/D: strafe ---
    const strafe = input.strafe;
    if (strafe !== 0) {
      const strafeX = -this.dirY;
      const strafeY = this.dirX;
      const nx = this.posX + strafeX * moveSpeed * 0.7 * strafe;
      const ny = this.posY + strafeY * moveSpeed * 0.7 * strafe;
      if (this.canWalk(nx, this.posY)) this.posX = nx;
      if (this.canWalk(this.posX, ny)) this.posY = ny;
    }
  }

  private canWalk(x: number, y: number): boolean {
    const mx = Math.floor(x);
    const my = Math.floor(y);
    if (mx < 0 || mx >= MAP_SIZE || my < 0 || my >= MAP_SIZE) return false;
    return (MAP[my]?.[mx] ?? 1) === 0;
  }

  get currentFloor(): number {
    return 0;
  }

  get positionInFloor(): number {
    return Math.floor(this.posX + this.posY * MAP_SIZE);
  }
}
