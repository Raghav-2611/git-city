import * as THREE from 'three';
import { SeededRNG } from '../utils/SeededRNG';

const NPC_COUNT = 8;
const LANE_POSITIONS = [-6.5, -2.5, 2.5, 6.5]; // X lanes
const MIN_SPEED = 6;
const MAX_SPEED = 14;
const WRAP_AHEAD = 20;  // units ahead of city start to respawn

interface NPCCar {
  position: THREE.Vector3;
  velocity: number;
  lane: number;
  mesh: THREE.Group;
}

/**
 * Simple NPC traffic system.
 * Cars drive forward in lanes, wrap around when they exit city bounds.
 */
export class TrafficSystem {
  private cars: NPCCar[] = [];
  private cityLength: number;
  private rng: SeededRNG;

  constructor(cityLength: number) {
    this.cityLength = cityLength;
    this.rng = new SeededRNG('traffic-seed');
  }

  createCars(scene: THREE.Group) {
    const carColors = [0x2266cc, 0xcc4422, 0x22aa66, 0xaa8822, 0x6622aa, 0x226688];

    for (let i = 0; i < NPC_COUNT; i++) {
      const lane = LANE_POSITIONS[this.rng.int(0, LANE_POSITIONS.length - 1)];
      const startZ = this.rng.range(10, this.cityLength * 0.8);
      const speed = this.rng.range(MIN_SPEED, MAX_SPEED);
      const color = this.rng.pick(carColors);

      const carGroup = createNPCCarMesh(color);
      carGroup.position.set(lane, 0, startZ);
      scene.add(carGroup);

      this.cars.push({
        position: carGroup.position,
        velocity: speed,
        lane,
        mesh: carGroup,
      });
    }
  }

  update(dt: number) {
    for (const car of this.cars) {
      car.position.z += car.velocity * dt;

      // Wheel rotation
      car.mesh.children.forEach((child) => {
        if (child.name.startsWith('wheel')) {
          child.rotation.x += (car.velocity / 1.2) * dt;
        }
      });

      // Wrap around
      if (car.position.z > this.cityLength + WRAP_AHEAD) {
        car.position.z = -WRAP_AHEAD;
      }
    }
  }

  dispose() {
    this.cars = [];
  }
}

function createNPCCarMesh(color: number): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

  // Body
  const bodyGeo = new THREE.BoxGeometry(1.9, 0.7, 4.0);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2.0);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  cabin.position.set(0, 1.1, -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Windshield
  const windGeo = new THREE.BoxGeometry(1.5, 0.5, 0.05);
  const wind = new THREE.Mesh(windGeo, glassMat);
  wind.position.set(0, 1.1, 0.9);
  group.add(wind);

  // Wheels
  const wheelPositions = [
    [-1.05, 0.3, 1.3],
    [1.05, 0.3, 1.3],
    [-1.05, 0.3, -1.3],
    [1.05, 0.3, -1.3],
  ];

  wheelPositions.forEach(([x, y, z], i) => {
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10);
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.name = `wheel-${i}`;
    wheel.castShadow = true;
    group.add(wheel);
  });

  return group;
}
