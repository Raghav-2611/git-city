import * as THREE from 'three';
import type { CityBlock } from '../types/contribution';
import { distanceXZ } from '../utils/mathUtils';

const PROXIMITY_SHOW = 30;    // distance to show info card
const PROXIMITY_HIDE = 40;    // distance to hide info card (hysteresis)

export type InteractionEvent =
  | { type: 'enter'; block: CityBlock }
  | { type: 'exit' };

type Listener = (event: InteractionEvent) => void;

/**
 * Detects when the player car enters/exits proximity of a building.
 * Uses hysteresis to avoid flickering near the threshold.
 */
export class InteractionSystem {
  private blocks: CityBlock[];
  private activeBlock: CityBlock | null = null;
  private listeners: Listener[] = [];

  constructor(blocks: CityBlock[]) {
    this.blocks = blocks.filter((b) => b.day.contributions > 0);
  }

  on(listener: Listener) {
    this.listeners.push(listener);
  }

  off(listener: Listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private emit(event: InteractionEvent) {
    for (const l of this.listeners) l(event);
  }

  update(carPosition: THREE.Vector3) {
    const carXZ = new THREE.Vector3(carPosition.x, 0, carPosition.z);

    // Find nearest building within show radius
    let nearest: CityBlock | null = null;
    let nearestDist = Infinity;

    for (const block of this.blocks) {
      const blockPos = new THREE.Vector3(block.worldX, 0, block.worldZ);
      const dist = distanceXZ(carXZ, blockPos);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = block;
      }
    }

    if (nearest && nearestDist < PROXIMITY_SHOW) {
      if (this.activeBlock?.day.date !== nearest.day.date) {
        this.activeBlock = nearest;
        this.emit({ type: 'enter', block: nearest });
      }
    } else if (this.activeBlock && nearestDist > PROXIMITY_HIDE) {
      this.activeBlock = null;
      this.emit({ type: 'exit' });
    }
  }
}
