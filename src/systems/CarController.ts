import * as THREE from 'three';
import { clamp } from '../utils/mathUtils';

export const MAX_SPEED = 28;       // units/sec forward
export const MAX_REVERSE = 8;      // units/sec reverse
export const ACCELERATION = 14;    // units/sec²
export const BRAKING = 22;         // units/sec² (braking stronger than accel)
export const FRICTION = 0.88;      // multiplier per frame (< 1 = slowdown)
export const HANDBRAKE_FRICTION = 0.72;
export const STEER_SPEED = 2.2;    // radians/sec at full steering
export const MAX_STEER = 0.55;     // max wheel angle in radians
export const STEER_RETURN = 3.5;   // how fast wheel returns to center

export interface CarState {
  position: THREE.Vector3;
  rotation: number;       // Y-axis yaw in radians
  velocity: number;       // scalar, forward positive
  steerAngle: number;
  wheelRotation: number;  // for spinning wheel meshes
}

export interface CarInputs {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
}

/**
 * Arcade car physics controller.
 * No physics engine — pure math for responsive, fun driving.
 */
export class CarController {
  state: CarState;
  private startPosition: THREE.Vector3;

  constructor(startPosition: THREE.Vector3) {
    this.startPosition = startPosition.clone();
    this.state = {
      position: startPosition.clone(),
      rotation: 0,
      velocity: 0,
      steerAngle: 0,
      wheelRotation: 0,
    };
  }

  reset() {
    this.state.position.copy(this.startPosition);
    this.state.rotation = 0;
    this.state.velocity = 0;
    this.state.steerAngle = 0;
  }

  update(inputs: CarInputs, dt: number) {
    const { forward, backward, left, right, handbrake } = inputs;
    let { velocity, steerAngle, rotation } = this.state;

    // ── Acceleration / braking ─────────────────────────────────────────────
    if (forward) {
      if (velocity < 0) {
        // Braking from reverse
        velocity += BRAKING * dt;
      } else {
        velocity = Math.min(MAX_SPEED, velocity + ACCELERATION * dt);
      }
    } else if (backward) {
      if (velocity > 0) {
        // Braking from forward
        velocity -= BRAKING * dt;
      } else {
        velocity = Math.max(-MAX_REVERSE, velocity - ACCELERATION * 0.6 * dt);
      }
    }

    // ── Friction ───────────────────────────────────────────────────────────
    if (!forward && !backward) {
      const friction = handbrake ? HANDBRAKE_FRICTION : FRICTION;
      velocity *= Math.pow(friction, dt * 60);
      if (Math.abs(velocity) < 0.05) velocity = 0;
    }

    // ── Steering ──────────────────────────────────────────────────────────
    const steerTarget = left ? MAX_STEER : right ? -MAX_STEER : 0;
    const steerDelta = steerTarget - steerAngle;
    // Steering is more responsive at low speed
    const steerRate = STEER_SPEED + (1 - Math.abs(velocity) / MAX_SPEED) * 1.5;
    steerAngle += clamp(steerDelta, -steerRate * dt, steerRate * dt);

    if (!left && !right) {
      // Return wheel to center
      const returnMag = STEER_RETURN * dt;
      if (Math.abs(steerAngle) < returnMag) {
        steerAngle = 0;
      } else {
        steerAngle -= Math.sign(steerAngle) * returnMag;
      }
    }

    // ── Turning (bicycle model) ────────────────────────────────────────────
    if (Math.abs(velocity) > 0.1) {
      const turnRadius = 7.0; // wheelbase equivalent
      const angularVelocity = (velocity / turnRadius) * steerAngle;
      rotation += angularVelocity * dt;
    }

    // ── Move forward ──────────────────────────────────────────────────────
    const forward3D = new THREE.Vector3(
      Math.sin(rotation),
      0,
      Math.cos(rotation)
    );

    this.state.position.addScaledVector(forward3D, velocity * dt);
    this.state.position.y = 0; // keep on ground

    // ── Wheel spin ────────────────────────────────────────────────────────
    this.state.wheelRotation += (velocity / 1.4) * dt;

    this.state.velocity = velocity;
    this.state.steerAngle = steerAngle;
    this.state.rotation = rotation;
  }
}
