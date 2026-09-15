import * as THREE from 'three';
import { lerp } from '../utils/mathUtils';

// Camera offset in car-local space
const CAM_OFFSET_BACK = -15;
const CAM_OFFSET_UP = 7;
const CAM_LOOK_AHEAD = 10; // how far ahead of car to look

const POSITION_LERP = 0.07; // lower = more lag (cinematic)
const LOOKAT_LERP = 0.1;

/**
 * Third-person chase camera.
 * Smoothly follows the car with cinematic damping.
 */
export class CameraController {
  private targetPosition = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private initialized = false;

  update(
    camera: THREE.Camera,
    carPosition: THREE.Vector3,
    carRotation: number,
    dt: number
  ) {
    // Compute desired camera position (behind and above car)
    const sinR = Math.sin(carRotation);
    const cosR = Math.cos(carRotation);

    const desiredX = carPosition.x + sinR * CAM_OFFSET_BACK;
    const desiredY = Math.max(carPosition.y + CAM_OFFSET_UP, 2.5);
    const desiredZ = carPosition.z + cosR * CAM_OFFSET_BACK;

    this.targetPosition.set(desiredX, desiredY, desiredZ);

    // Look-at target: in front of the car
    const lookX = carPosition.x + sinR * CAM_LOOK_AHEAD;
    const lookY = carPosition.y + 1.5;
    const lookZ = carPosition.z + cosR * CAM_LOOK_AHEAD;

    if (!this.initialized) {
      camera.position.copy(this.targetPosition);
      this.currentLookAt.set(lookX, lookY, lookZ);
      this.initialized = true;
    }

    // Smooth follow
    camera.position.lerp(this.targetPosition, POSITION_LERP);

    // Smooth look-at
    this.currentLookAt.set(
      lerp(this.currentLookAt.x, lookX, LOOKAT_LERP),
      lerp(this.currentLookAt.y, lookY, LOOKAT_LERP),
      lerp(this.currentLookAt.z, lookZ, LOOKAT_LERP)
    );

    camera.lookAt(this.currentLookAt);
  }

  /** Jump camera instantly to position (for intro / reset) */
  snap(camera: THREE.Camera, carPosition: THREE.Vector3, carRotation: number) {
    const sinR = Math.sin(carRotation);
    const cosR = Math.cos(carRotation);
    camera.position.set(
      carPosition.x + sinR * CAM_OFFSET_BACK,
      carPosition.y + CAM_OFFSET_UP,
      carPosition.z + cosR * CAM_OFFSET_BACK
    );
    this.currentLookAt.set(
      carPosition.x + sinR * CAM_LOOK_AHEAD,
      carPosition.y + 1.5,
      carPosition.z + cosR * CAM_LOOK_AHEAD
    );
    camera.lookAt(this.currentLookAt);
    this.initialized = true;
  }
}
