import * as THREE from 'three';
import { ROAD_HALF_WIDTH } from '../services/ContributionMapper';

const ROAD_WIDTH = ROAD_HALF_WIDTH * 2; // 18 units total
const SIDEWALK_WIDTH = 3;
const CITY_LENGTH_BUFFER = 200; // extra road before/after city

/**
 * Generates the road mesh as a merged BufferGeometry for performance.
 * Includes asphalt, sidewalks, lane markings, center line, crosswalks.
 */
export function createRoad(cityLength: number): THREE.Group {
  const totalLength = cityLength + CITY_LENGTH_BUFFER * 2;
  const startZ = -CITY_LENGTH_BUFFER;
  const group = new THREE.Group();

  // ── Asphalt base ───────────────────────────────────────────────────────────
  const asphaltGeo = new THREE.PlaneGeometry(ROAD_WIDTH, totalLength);
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x282830,
    roughness: 0.95,
    metalness: 0.0,
  });
  const asphalt = new THREE.Mesh(asphaltGeo, asphaltMat);
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(0, 0.01, startZ + totalLength / 2);
  asphalt.receiveShadow = true;
  group.add(asphalt);

  // ── Left sidewalk ──────────────────────────────────────────────────────────
  addSidewalk(group, -(ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2), totalLength, startZ);
  // ── Right sidewalk ─────────────────────────────────────────────────────────
  addSidewalk(group, ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2, totalLength, startZ);

  // ── Center yellow double line ──────────────────────────────────────────────
  addCenterLine(group, totalLength, startZ);

  // ── White lane dashes ──────────────────────────────────────────────────────
  addLaneDashes(group, totalLength, startZ);

  // ── Crosswalks every ~22*4 = 88 units ─────────────────────────────────────
  addCrosswalks(group, cityLength, startZ);

  // ── Road shoulder edges ────────────────────────────────────────────────────
  addCurbs(group, totalLength, startZ);

  return group;
}

function addSidewalk(group: THREE.Group, centerX: number, length: number, startZ: number) {
  const geo = new THREE.BoxGeometry(SIDEWALK_WIDTH, 0.15, length);
  const mat = new THREE.MeshStandardMaterial({ color: 0x888898, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(centerX, 0.08, startZ + length / 2);
  mesh.receiveShadow = true;
  group.add(mesh);
}

function addCenterLine(group: THREE.Group, length: number, startZ: number) {
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.8 });
  // Two parallel lines
  for (const offset of [-0.18, 0.18]) {
    const geo = new THREE.BoxGeometry(0.12, 0.01, length);
    const m = new THREE.Mesh(geo, lineMat);
    m.position.set(offset, 0.02, startZ + length / 2);
    group.add(m);
  }
}

function addLaneDashes(group: THREE.Group, length: number, startZ: number) {
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.8 });
  // Lane positions: -4.5 and +4.5 (inner lane dividers)
  for (const laneX of [-4.5, 4.5]) {
    const dashLength = 4;
    const dashGap = 6;
    const dashPeriod = dashLength + dashGap;
    const count = Math.floor(length / dashPeriod);

    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.1, 0.01, dashLength);
      const m = new THREE.Mesh(geo, lineMat);
      m.position.set(laneX, 0.02, startZ + i * dashPeriod + dashLength / 2);
      group.add(m);
    }
  }
}

function addCrosswalks(group: THREE.Group, cityLength: number, startZ: number) {
  const crosswalkMat = new THREE.MeshStandardMaterial({ color: 0xccccbb, roughness: 0.85 });
  const stripeWidth = 0.9;
  const stripeCount = 6;
  const crosswalkSpacing = 88; // units between crosswalks

  let z = 44; // start offset into city
  while (z < cityLength) {
    for (let i = 0; i < stripeCount; i++) {
      const x = -ROAD_HALF_WIDTH + (i + 0.5) * ((ROAD_WIDTH) / stripeCount);
      const geo = new THREE.BoxGeometry(stripeWidth, 0.01, ROAD_HALF_WIDTH * 0.6);
      const m = new THREE.Mesh(geo, crosswalkMat);
      m.position.set(x, 0.02, startZ + z);
      group.add(m);
    }
    z += crosswalkSpacing;
  }
}

function addCurbs(group: THREE.Group, length: number, startZ: number) {
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x666670, roughness: 0.9 });
  for (const side of [-1, 1]) {
    const x = side * ROAD_HALF_WIDTH;
    const geo = new THREE.BoxGeometry(0.3, 0.18, length);
    const m = new THREE.Mesh(geo, curbMat);
    m.position.set(x, 0.09, startZ + length / 2);
    group.add(m);
  }
}
