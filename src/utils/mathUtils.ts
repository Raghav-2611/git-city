import * as THREE from 'three';

/** Linearly interpolate a value */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Map a value from one range to another */
export function mapRange(
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Smooth damping for camera / follow behavior */
export function smoothDamp(
  current: number,
  target: number,
  smoothTime: number,
  deltaTime: number
): number {
  const t = clamp(deltaTime / Math.max(smoothTime, 0.0001), 0, 1);
  return lerp(current, target, t);
}

/** Format a date string to a display string */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Get the month name from a date string */
export function getMonthName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/** Get year from date string */
export function getYear(dateStr: string): number {
  return parseInt(dateStr.split('-')[0]);
}

/** Get month (1-indexed) from date string */
export function getMonth(dateStr: string): number {
  return parseInt(dateStr.split('-')[1]);
}

/** Hex color string to THREE.Color */
export function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/** Distance between two 3D points (flat XZ plane) */
export function distanceXZ(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}
