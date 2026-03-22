import { Container, Graphics, ColorMatrixFilter } from "pixi.js";

export class AtmosphereSystem {
  private vignetteGraphics: Graphics;
  private sepiaFilter: ColorMatrixFilter;
  private time = 0;

  constructor(
    private worldContainer: Container,
    private screenWidth: number,
    private screenHeight: number
  ) {
    // Sepia color matrix on world
    this.sepiaFilter = new ColorMatrixFilter();
    this.sepiaFilter.sepia(false);
    this.worldContainer.filters = [this.sepiaFilter];

    // Vignette overlay
    this.vignetteGraphics = new Graphics();
    this.drawVignette();
  }

  get vignetteContainer(): Graphics {
    return this.vignetteGraphics;
  }

  resize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
    this.drawVignette();
  }

  update(dt: number) {
    this.time += dt * 0.01;

    // Subtle ambient light flicker
    const flicker = 0.97 + Math.sin(this.time * 2.3) * 0.03;
    this.worldContainer.alpha = flicker;
  }

  private drawVignette() {
    const g = this.vignetteGraphics;
    g.clear();

    const cx = this.screenWidth / 2;
    const cy = this.screenHeight / 2;
    const maxRadius = Math.max(this.screenWidth, this.screenHeight) * 0.7;

    // Radial gradient via concentric circles
    const steps = 20;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const radius = maxRadius * t;
      const alpha = Math.pow(1 - t, 3) * 0.7; // cubic falloff
      g.circle(cx, cy, radius);
      g.fill({ color: 0x000000, alpha });
    }
  }
}
