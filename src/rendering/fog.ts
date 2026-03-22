import { VIEW_DISTANCE, FOG_START } from "@/config";

export function applyFog(
  r: number,
  g: number,
  b: number,
  distance: number,
  flicker: number
): [number, number, number] {
  const fogStart = VIEW_DISTANCE * FOG_START;
  let fogFactor = 0;
  if (distance > fogStart) {
    fogFactor = Math.min(1, (distance - fogStart) / (VIEW_DISTANCE - fogStart));
  }

  const brightness = flicker * (1 - fogFactor * 0.9);
  return [
    Math.max(0, Math.min(255, Math.round(r * brightness))),
    Math.max(0, Math.min(255, Math.round(g * brightness))),
    Math.max(0, Math.min(255, Math.round(b * brightness))),
  ];
}
