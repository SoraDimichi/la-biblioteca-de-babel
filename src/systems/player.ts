import {
  MOVE_SPEED,
  HEAD_BOB_AMPLITUDE,
  HEAD_BOB_FREQUENCY,
  STEPS_PER_FLOOR,
} from "@/config";
import type { InputSystem } from "@/systems/input";

const MOUSE_SENSITIVITY = 0.003;
const VERTICAL_LIMIT = 0.8; // radians, ~45 degrees

export class PlayerSystem {
  position = 0; // distance along spiral (in steps)
  angle = 0; // horizontal look angle (radians, 0 = forward along corridor)
  pitch = 0; // vertical look angle (radians, 0 = level, negative = look up)
  headBob = 0;
  private bobTime = 0;

  update(dt: number, input: InputSystem) {
    // Mouse look
    const mouse = input.consumeMouseDelta();
    this.angle += mouse.dx * MOUSE_SENSITIVITY;
    this.pitch += mouse.dy * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, this.pitch));

    // Movement: W/S along corridor, A/D minor strafe (corridor is narrow)
    const moveDir = input.forward;
    this.position += moveDir * MOVE_SPEED * dt;

    // Head bob
    if (moveDir !== 0) {
      this.bobTime += dt * HEAD_BOB_FREQUENCY * Math.PI * 2;
      this.headBob = Math.sin(this.bobTime) * HEAD_BOB_AMPLITUDE;
    } else {
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
