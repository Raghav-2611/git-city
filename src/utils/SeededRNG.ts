/**
 * Seeded pseudo-random number generator (Mulberry32 algorithm).
 * Given the same seed, always produces the same sequence.
 * Use date strings as seeds so each building date always looks identical.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: string) {
    this.state = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    let z = (this.state += 0x6d2b79f5);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns an integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Picks a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}
