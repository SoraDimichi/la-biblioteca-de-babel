interface Tween {
  target: Record<string, number>;
  property: string;
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  easing: (t: number) => number;
  onComplete?: () => void;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class AnimationSystem {
  private tweens: Tween[] = [];

  animate(
    target: Record<string, number>,
    property: string,
    to: number,
    duration: number,
    easing = easeInOut,
    onComplete?: () => void
  ) {
    const from = target[property] ?? 0;
    this.tweens.push({ target, property, from, to, duration, elapsed: 0, easing, onComplete });
  }

  update(dt: number) {
    const frameTime = dt / 60; // Convert from frames to seconds

    this.tweens = this.tweens.filter((tween) => {
      tween.elapsed += frameTime;
      const t = Math.min(tween.elapsed / tween.duration, 1);
      const easedT = tween.easing(t);
      tween.target[tween.property] = tween.from + (tween.to - tween.from) * easedT;

      if (t >= 1) {
        tween.onComplete?.();
        return false;
      }
      return true;
    });
  }

  get activeCount(): number {
    return this.tweens.length;
  }
}
