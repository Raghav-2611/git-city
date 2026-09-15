import * as THREE from 'three';
import { SeededRNG } from '../utils/SeededRNG';
import type { ContributionDay } from '../types/contribution';

type LotVariant = 'parking' | 'grass' | 'construction' | 'plaza';

/**
 * Creates an empty lot for zero-contribution days.
 * Varies per date using seeded RNG for visual diversity.
 */
export function createEmptyLot(day: ContributionDay, width: number = 12, depth: number = 11): THREE.Group {
  const rng = new SeededRNG(day.date + '-lot');
  const group = new THREE.Group();
  const variant: LotVariant = rng.pick(['parking', 'grass', 'construction', 'plaza']);

  // Base ground
  const groundColor = variant === 'grass' ? 0x4a6741 : 0x3a3a44;
  const groundGeo = new THREE.BoxGeometry(width, 0.15, depth);
  const groundMat = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0.075;
  ground.receiveShadow = true;
  group.add(ground);

  if (variant === 'parking') {
    addParkingMarkings(group, width, depth, rng);
    addParkedCar(group, width, depth, rng);
  } else if (variant === 'grass') {
    addGrassDetails(group, width, depth, rng);
    addTree(group, rng.range(-width / 3, width / 3), rng.range(-depth / 3, depth / 3), rng);
  } else if (variant === 'construction') {
    addConstructionSite(group, width, depth, rng);
  } else {
    addPlazaDetails(group, width, depth, rng);
  }

  return group;
}

function addParkingMarkings(group: THREE.Group, width: number, depth: number, rng: SeededRNG) {
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const lineCount = Math.floor(width / 3);
  for (let i = 0; i < lineCount - 1; i++) {
    const x = -width / 2 + (i + 1) * (width / lineCount);
    const lineGeo = new THREE.BoxGeometry(0.12, 0.01, depth * 0.8);
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(x, 0.16, 0);
    group.add(line);
  }
}

function addParkedCar(group: THREE.Group, width: number, depth: number, rng: SeededRNG) {
  const carColors = [0x8899bb, 0xccaa88, 0x667788, 0x445566];
  const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4.2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: rng.pick(carColors),
    roughness: 0.4,
    metalness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(rng.range(-width / 4, width / 4), 0.55, rng.range(-depth / 4, depth / 4));
  body.rotation.y = rng.range(-0.2, 0.2);
  // Roof
  const roofGeo = new THREE.BoxGeometry(1.7, 0.65, 2.2);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 0.72, -0.2);
  body.add(roof);
  group.add(body);
}

function addGrassDetails(group: THREE.Group, width: number, depth: number, rng: SeededRNG) {
  // Small grass tufts
  const tufMat = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 1.0 });
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.ConeGeometry(0.2, 0.4, 4);
    const m = new THREE.Mesh(geo, tufMat);
    m.position.set(rng.range(-width / 2 + 1, width / 2 - 1), 0.35, rng.range(-depth / 2 + 1, depth / 2 - 1));
    group.add(m);
  }
}

function addTree(group: THREE.Group, x: number, z: number, rng: SeededRNG) {
  const height = rng.range(3, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, height, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, height / 2, z);
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGeo = new THREE.SphereGeometry(rng.range(1.5, 2.5), 7, 6);
  const foliageMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.28 + rng.range(-0.03, 0.03), 0.5, 0.28),
    roughness: 1.0,
  });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.set(x, height + 1.2, z);
  foliage.castShadow = true;
  group.add(foliage);
}

function addConstructionSite(group: THREE.Group, width: number, depth: number, rng: SeededRNG) {
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xdd8822, roughness: 0.8 });
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xeecc33, roughness: 0.9 });
  
  // Construction barriers around perimeter
  const positions = [
    [-width / 2 + 0.5, 0, 0, width, depth],
    [width / 2 - 0.5, 0, 0, width, depth],
    [0, 0, -depth / 2 + 0.5, depth, width],
    [0, 0, depth / 2 - 0.5, depth, width],
  ];

  for (let i = 0; i < 4; i++) {
    const count = Math.floor(rng.range(1, 3));
    for (let j = 0; j < count; j++) {
      const geo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
      const m = new THREE.Mesh(geo, barrierMat);
      m.position.set(
        rng.range(-width / 3, width / 3),
        0.75,
        rng.range(-depth / 3, depth / 3)
      );
      group.add(m);
    }
  }

  // Unfinished foundation slab
  const slabGeo = new THREE.BoxGeometry(width * 0.7, 0.3, depth * 0.7);
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x888898, roughness: 0.95 });
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = 0.3;
  group.add(slab);
}

function addPlazaDetails(group: THREE.Group, width: number, depth: number, rng: SeededRNG) {
  // Bench
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8 });
  const benchGeo = new THREE.BoxGeometry(2.2, 0.2, 0.5);
  const bench = new THREE.Mesh(benchGeo, benchMat);
  bench.position.set(rng.range(-2, 2), 0.6, rng.range(-depth / 3, depth / 3));
  group.add(bench);
  // Bench legs
  for (const lx of [-0.9, 0.9]) {
    const legGeo = new THREE.BoxGeometry(0.12, 0.5, 0.4);
    const leg = new THREE.Mesh(legGeo, benchMat);
    leg.position.set(bench.position.x + lx, 0.3, bench.position.z);
    group.add(leg);
  }
  // Tree
  addTree(group, rng.range(-width / 3, width / 3), rng.range(-depth / 3, depth / 3), rng);
}
