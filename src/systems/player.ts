import {
  MOVE_SPEED,
  MOUSE_LOOK_RANGE,
  HEAD_BOB_AMPLITUDE,
  HEAD_BOB_FREQUENCY,
  STEPS_PER_FLOOR,
} from "@/config";
import type { InputSystem } from "@/systems/input";

export class PlayerSystem {
  position = 0; // distance along spiral (in steps)
  lookOffset = 0; // horizontal look offset from mouse (-1 to 1)
  headBob = 0; // vertical head bob offset
  private bobTime = 0;
  private moving = false;

  update(dt: number, input: InputSystem) {
    const moveDir = input.forward;
    this.moving = moveDir !== 0;

    // Move along spiral
    this.position += moveDir * MOVE_SPEED * dt;

    // Mouse look (slight horizontal offset)
    this.lookOffset = input.mouseNormX * MOUSE_LOOK_RANGE;

    // Head bob
    if (this.moving) {
      this.bobTime += dt * HEAD_BOB_FREQUENCY * Math.PI * 2;
      this.headBob = Math.sin(this.bobTime) * HEAD_BOB_AMPLITUDE;
    } else {
      // Smoothly return to center
      this.headBob *= 0.9;
      this.bobTime = 0;
    }
  }

  get currentFloor(): number {
    return Math.floor(this.position / STEPS_PER_FLOOR);
  }

  get positionInFloor(): number {
    return ((this.position % STEPS_PER_FLOOR) + STEPS_PER_FLOOR) % STEPS_PER_FLOOR;
  }
}
