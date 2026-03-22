import {
  MOVE_SPEED,
  MOUSE_SENSITIVITY,
  HEAD_BOB_AMPLITUDE,
  HEAD_BOB_FREQUENCY,
  STEPS_PER_FLOOR,
  PITCH_LIMIT,
} from "@/config";
import type { InputSystem } from "@/systems/input";

export class PlayerSystem {
  position = 0; // distance along spiral in steps
  angle = 0; // horizontal look (yaw) - radians, 0 = forward
  pitch = 0; // vertical look - radians, 0 = level
  headBob = 0;
  private bobTime = 0;

  update(dt: number, input: InputSystem) {
    // Mouse look (pointer lock)
    const mouse = input.consumeMouseDelta();
    this.angle += mouse.dx * MOUSE_SENSITIVITY;
    this.pitch += mouse.dy * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));

    // Move forward/backward along spiral
    const moveDir = input.forward;
    this.position += moveDir * MOVE_SPEED * dt;

    // Head bob while moving
    if (moveDir !== 0) {
      this.bobTime += dt * HEAD_BOB_FREQUENCY * Math.PI * 2;
      this.headBob = Math.sin(this.bobTime) * HEAD_BOB_AMPLITUDE;
    } else {
      this.headBob *= 0.85;
      if (Math.abs(this.headBob) < 0.001) this.headBob = 0;
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
