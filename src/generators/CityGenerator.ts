import * as THREE from 'three';
import type { CityData, CityBlock } from '../types/contribution';
import { createBuilding } from './BuildingGenerator';
import { createEmptyLot } from './EmptyLotGenerator';
import { createRoad } from './RoadGenerator';
import { SeededRNG } from '../utils/SeededRNG';

export const STREET_LAMP_SPACING = 22; // one lamp per block
const TREE_X_OFFSET = 14.5; // just outside sidewalk

interface SceneObjects {
  road: THREE.Group;
  buildings: THREE.Group;
  streetFurniture: THREE.Group;
  blockMap: Map<string, { group: THREE.Group; block: CityBlock }>;
}

/**
 * Orchestrates the full city scene: road, buildings, empty lots, and furniture.
 * Returns structured groups for adding to the R3F scene.
 */
export function generateCity(cityData: CityData): SceneObjects {
  const road = createRoad(cityData.cityLength);

  const buildings = new THREE.Group();
  buildings.name = 'buildings';

  const streetFurniture = new THREE.Group();
  streetFurniture.name = 'streetFurniture';

  const blockMap = new Map<string, { group: THREE.Group; block: CityBlock }>();

  // Generate buildings / empty lots
  for (const block of cityData.blocks) {
    let blockGroup: THREE.Group;

    if (block.day.contributions === 0) {
      blockGroup = createEmptyLot(block.day);
    } else {
      blockGroup = createBuilding(block.day);
    }

    blockGroup.position.set(block.worldX, 0, block.worldZ);
    blockGroup.name = `block-${block.day.date}`;
    buildings.add(blockGroup);
    blockMap.set(block.day.date, { group: blockGroup, block });
  }

  // Street furniture placed at block intervals
  const totalBlocks = Math.ceil(cityData.totalDays / 2);
  const rng = new SeededRNG('city-furniture');

  for (let i = 0; i <= totalBlocks; i++) {
    const z = i * STREET_LAMP_SPACING;

    // Street lamps on both sides
    addStreetLamp(streetFurniture, -16, z, rng);
    addStreetLamp(streetFurniture, 16, z, rng);

    // Trees on sidewalk every other block
    if (i % 2 === 0) {
      addSidewalkTree(streetFurniture, -TREE_X_OFFSET, z + 5, rng);
      addSidewalkTree(streetFurniture, TREE_X_OFFSET, z + 5, rng);
    }

    // Traffic light every 4 blocks
    if (i % 4 === 0 && i > 0) {
      addTrafficLight(streetFurniture, -10.5, z, rng);
      addTrafficLight(streetFurniture, 10.5, z, rng);
    }
  }

  return { road, buildings, streetFurniture, blockMap };
}

function addStreetLamp(group: THREE.Group, x: number, z: number, _rng: SeededRNG) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7, metalness: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e0,
    emissive: 0xfff5aa,
    emissiveIntensity: 1.2,
  });

  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 7, 6);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(x, 3.5, z);
  pole.castShadow = true;
  group.add(pole);

  // Arm
  const armGeo = new THREE.BoxGeometry(1.2, 0.08, 0.08);
  const arm = new THREE.Mesh(armGeo, poleMat);
  const armDir = x < 0 ? 0.6 : -0.6;
  arm.position.set(x + armDir, 7.1, z);
  group.add(arm);

  // Light head
  const headGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.4, 8);
  const head = new THREE.Mesh(headGeo, lightMat);
  head.position.set(x + armDir * 2, 7.0, z);
  group.add(head);
}

function addSidewalkTree(group: THREE.Group, x: number, z: number, rng: SeededRNG) {
  const h = rng.range(4, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e10, roughness: 0.95 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, h, 6), trunkMat);
  trunk.position.set(x, h / 2, z);
  trunk.castShadow = true;
  group.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.29 + rng.range(-0.02, 0.02), 0.45, 0.25),
    roughness: 1.0,
  });
  const foliage = new THREE.Mesh(new THREE.SphereGeometry(rng.range(1.2, 2.0), 7, 5), foliageMat);
  foliage.position.set(x, h + 1.0, z);
  foliage.castShadow = true;
  group.add(foliage);
}

function addTrafficLight(group: THREE.Group, x: number, z: number, rng: SeededRNG) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8, metalness: 0.3 });
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 5, 6);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(x, 2.5, z);
  group.add(pole);

  // Light housing
  const boxGeo = new THREE.BoxGeometry(0.5, 1.4, 0.4);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(x, 5.2, z);
  group.add(box);

  // Lights (red, yellow, green)
  const lightColors = [0xff3300, 0xffaa00, 0x33cc44];
  const lightState = rng.int(0, 2);
  lightColors.forEach((col, i) => {
    const active = i === lightState;
    const litMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: active ? col : 0x000000,
      emissiveIntensity: active ? 1.0 : 0,
    });
    const litGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const lit = new THREE.Mesh(litGeo, litMat);
    lit.position.set(x, 5.5 - i * 0.45, z + 0.22);
    group.add(lit);
  });
}
