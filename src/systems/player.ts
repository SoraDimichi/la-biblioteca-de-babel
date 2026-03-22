import type { InputSystem } from "@/systems/input";
import { MAP, MAP_SIZE } from "@/rendering/renderer";

const MOVE_SPEED = 5.0;
const ROT_SPEED = 0.003; // mouse sensitivity
const COLLISION_MARGIN = 0.3;

export class PlayerSystem {
  // Position on the 2D map — spawn in the corridor ring (radius ~10.5 from center)
  posX = 16;
  posY = 5.5;

  // Direction vector (unit vector pointing where player looks)
  dirX = -1;
  dirY = 0;

  // Camera plane (perpendicular to dir, determines FOV)
  // Length of planeY determines FOV: 0.66 ≈ 66 degree FOV
  planeX = 0;
  planeY = 0.66;

  update(dt: number, input: InputSystem) {
    const moveSpeed = MOVE_SPEED * dt;

    // --- Mouse rotation (yaw) ---
    const mouse = input.consumeMouseDelta();
    const rotAngle = -mouse.dx * ROT_SPEED;

    if (rotAngle !== 0) {
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

    // --- A/D: strafe left/right ---
    const strafe = input.strafe;
    if (strafe !== 0) {
      // Strafe direction is perpendicular to look direction
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
    return 0; // single floor for now
  }

  get positionInFloor(): number {
    return Math.floor(this.posX + this.posY * MAP_SIZE);
  }
}
