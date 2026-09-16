import * as THREE from 'three';
import { SeededRNG } from '../utils/SeededRNG';
import type { ContributionDay } from '../types/contribution';

export const FLOOR_HEIGHT = 3;
export const BASE_HEIGHT = 0.5; // raised foundation

// Shared materials for performance (created once, reused)
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getMaterial(key: string, params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial(params));
  }
  return materialCache.get(key)!;
}

type BuildingArchetype = 'commercial' | 'residential' | 'industrial';

interface BuildingSpec {
  width: number;
  depth: number;
  height: number;
  floors: number;
  archetype: BuildingArchetype;
  facadeColor: THREE.Color;
  accentColor: THREE.Color;
  hasBalconies: boolean;
  roofType: 'flat' | 'parapet' | 'penthouse';
}

function getBuildingSpec(day: ContributionDay, rng: SeededRNG): BuildingSpec {
  const floors = day.contributions;
  const height = floors * FLOOR_HEIGHT;

  const archetype = rng.pick<BuildingArchetype>(['commercial', 'residential', 'industrial']);

  // Color palette per archetype
  let facadeHue: number, facadeSat: number, facadeLit: number;
  let accentHue: number;

  if (archetype === 'commercial') {
    facadeHue = rng.range(200, 230);
    facadeSat = rng.range(0.1, 0.25);
    facadeLit = rng.range(0.45, 0.65);
    accentHue = rng.range(180, 210);
  } else if (archetype === 'residential') {
    facadeHue = rng.range(20, 50);
    facadeSat = rng.range(0.15, 0.35);
    facadeLit = rng.range(0.4, 0.6);
    accentHue = rng.range(15, 40);
  } else {
    facadeHue = rng.range(200, 240);
    facadeSat = rng.range(0.05, 0.15);
    facadeLit = rng.range(0.35, 0.5);
    accentHue = rng.range(0, 30);
  }

  const facadeColor = new THREE.Color().setHSL(facadeHue / 360, facadeSat, facadeLit);
  const accentColor = new THREE.Color().setHSL(accentHue / 360, 0.4, 0.5);

  return {
    width: rng.range(8, 14),
    depth: rng.range(8, 13),
    height,
    floors,
    archetype,
    facadeColor,
    accentColor,
    hasBalconies: rng.next() > 0.6 && archetype === 'residential',
    roofType: rng.pick(['flat', 'parapet', 'penthouse']),
  };
}

/**
 * Builds a detailed multi-floor building mesh group.
 * Each floor is individually generated with windows, floor bands, and facade detail.
 */
export function createBuilding(day: ContributionDay): THREE.Group {
  const rng = new SeededRNG(day.date);
  const spec = getBuildingSpec(day, rng);
  const group = new THREE.Group();

  // ── Main building body ─────────────────────────────────────────────────────
  const bodyGeo = new THREE.BoxGeometry(spec.width, spec.height, spec.depth);
  const bodyMat = getMaterial(`facade-${spec.facadeColor.getHexString()}`, {
    color: spec.facadeColor,
    roughness: archetype_roughness(spec.archetype),
    metalness: spec.archetype === 'commercial' ? 0.1 : 0.0,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = BASE_HEIGHT + spec.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // ── Foundation ─────────────────────────────────────────────────────────────
  const foundGeo = new THREE.BoxGeometry(spec.width + 0.4, BASE_HEIGHT, spec.depth + 0.4);
  const foundMat = getMaterial('foundation', { color: 0x555566, roughness: 0.9 });
  const foundation = new THREE.Mesh(foundGeo, foundMat);
  foundation.position.y = BASE_HEIGHT / 2;
  foundation.receiveShadow = true;
  group.add(foundation);

  // ── Floor separation bands ─────────────────────────────────────────────────
  const bandMat = getMaterial(`band-${spec.accentColor.getHexString()}`, {
    color: spec.accentColor,
    roughness: 0.8,
  });

  for (let floor = 1; floor < spec.floors; floor++) {
    const bandY = BASE_HEIGHT + floor * FLOOR_HEIGHT;
    const bandGeo = new THREE.BoxGeometry(spec.width + 0.1, 0.2, spec.depth + 0.1);
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = bandY;
    group.add(band);
  }

  // ── Windows (instanced per facade) ─────────────────────────────────────────
  addWindowInstances(group, spec, rng);

  // ── Roof ───────────────────────────────────────────────────────────────────
  addRoof(group, spec, rng);

  // ── Ground floor storefront ────────────────────────────────────────────────
  addStorefront(group, spec, rng);

  // ── Balconies ──────────────────────────────────────────────────────────────
  if (spec.hasBalconies && spec.floors >= 3) {
    addBalconies(group, spec, rng);
  }

  return group;
}

function archetype_roughness(a: BuildingArchetype): number {
  if (a === 'commercial') return 0.3;
  if (a === 'residential') return 0.75;
  return 0.85;
}

function addWindowInstances(group: THREE.Group, spec: BuildingSpec, _rng: SeededRNG) {
  const windowColor = new THREE.Color(0xfff5cc);
  const windowMat = new THREE.MeshStandardMaterial({
    color: windowColor,
    emissive: windowColor,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.3,
  });

  // Windows per row/col
  const winsPerRow = Math.max(1, Math.floor(spec.width / 3.5));
  const winsPerDepthRow = Math.max(1, Math.floor(spec.depth / 3.5));
  const winW = 0.9;
  const winH = 1.2;
  const winGeo = new THREE.PlaneGeometry(winW, winH);

  const totalCount = spec.floors * (winsPerRow * 2 + winsPerDepthRow * 2);
  if (totalCount <= 0) return;

  const instMesh = new THREE.InstancedMesh(winGeo, windowMat, totalCount);
  instMesh.castShadow = false;
  let idx = 0;
  const dummy = new THREE.Object3D();

  for (let floor = 0; floor < spec.floors; floor++) {
    const floorY = BASE_HEIGHT + floor * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.55;

    // Front (+Z) and back (-Z) facades
    for (let col = 0; col < winsPerRow; col++) {
      const x = -spec.width / 2 + (col + 0.5) * (spec.width / winsPerRow);
      // Front
      dummy.position.set(x, floorY, spec.depth / 2 + 0.05);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instMesh.setMatrixAt(idx++, dummy.matrix);
      // Back
      dummy.position.set(x, floorY, -spec.depth / 2 - 0.05);
      dummy.rotation.set(0, Math.PI, 0);
      dummy.updateMatrix();
      instMesh.setMatrixAt(idx++, dummy.matrix);
    }

    // Side facades
    for (let col = 0; col < winsPerDepthRow; col++) {
      const z = -spec.depth / 2 + (col + 0.5) * (spec.depth / winsPerDepthRow);
      // Right (+X)
      dummy.position.set(spec.width / 2 + 0.05, floorY, z);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      instMesh.setMatrixAt(idx++, dummy.matrix);
      // Left (-X)
      dummy.position.set(-spec.width / 2 - 0.05, floorY, z);
      dummy.rotation.set(0, -Math.PI / 2, 0);
      dummy.updateMatrix();
      instMesh.setMatrixAt(idx++, dummy.matrix);
    }
  }

  instMesh.count = idx;
  instMesh.instanceMatrix.needsUpdate = true;
  group.add(instMesh);
}

function addRoof(group: THREE.Group, spec: BuildingSpec, rng: SeededRNG) {
  const roofY = BASE_HEIGHT + spec.height;
  const roofMat = getMaterial('roof', { color: 0x333344, roughness: 0.9 });

  if (spec.roofType === 'flat') {
    const geo = new THREE.BoxGeometry(spec.width + 0.2, 0.3, spec.depth + 0.2);
    const mesh = new THREE.Mesh(geo, roofMat);
    mesh.position.y = roofY + 0.15;
    mesh.castShadow = true;
    group.add(mesh);
  } else if (spec.roofType === 'parapet') {
    // Raised parapet walls around roof edge
    const parapetH = 0.8;
    const parapetMat = getMaterial(`parapet-${spec.accentColor.getHexString()}`, {
      color: spec.accentColor,
      roughness: 0.8,
    });
    [
      { x: 0, z: spec.depth / 2 - 0.1, rx: spec.width, rz: 0.4 },
      { x: 0, z: -spec.depth / 2 + 0.1, rx: spec.width, rz: 0.4 },
      { x: spec.width / 2 - 0.1, z: 0, rx: 0.4, rz: spec.depth },
      { x: -spec.width / 2 + 0.1, z: 0, rx: 0.4, rz: spec.depth },
    ].forEach(({ x, z, rx, rz }) => {
      const geo = new THREE.BoxGeometry(rx, parapetH, rz);
      const m = new THREE.Mesh(geo, parapetMat);
      m.position.set(x, roofY + parapetH / 2, z);
      m.castShadow = true;
      group.add(m);
    });
    // Flat roof fill
    const fillGeo = new THREE.BoxGeometry(spec.width - 0.2, 0.2, spec.depth - 0.2);
    const fill = new THREE.Mesh(fillGeo, roofMat);
    fill.position.y = roofY + 0.1;
    group.add(fill);
  } else {
    // Penthouse top box
    const pw = spec.width * 0.45;
    const pd = spec.depth * 0.45;
    const ph = rng.range(2, 4);
    const pentGeo = new THREE.BoxGeometry(pw, ph, pd);
    const pentMat = getMaterial(`pent-${spec.facadeColor.getHexString()}`, {
      color: spec.facadeColor,
      roughness: 0.6,
    });
    const pent = new THREE.Mesh(pentGeo, pentMat);
    pent.position.set(0, roofY + ph / 2, 0);
    pent.castShadow = true;
    group.add(pent);
    // Roof slab
    const slabGeo = new THREE.BoxGeometry(spec.width + 0.2, 0.25, spec.depth + 0.2);
    const slab = new THREE.Mesh(slabGeo, roofMat);
    slab.position.y = roofY + 0.125;
    group.add(slab);
    // AC unit
    const acGeo = new THREE.BoxGeometry(1.5, 0.8, 1.0);
    const acMesh = new THREE.Mesh(acGeo, getMaterial('ac', { color: 0x888899, roughness: 0.8 }));
    acMesh.position.set(
      rng.range(-spec.width / 4, spec.width / 4),
      roofY + ph + 0.4,
      rng.range(-spec.depth / 4, spec.depth / 4)
    );
    group.add(acMesh);
  }
}

function addStorefront(group: THREE.Group, spec: BuildingSpec, _rng: SeededRNG) {
  if (spec.archetype === 'industrial') return;

  // Entrance canopy
  const canopyGeo = new THREE.BoxGeometry(spec.width * 0.4, 0.2, 1.2);
  const canopyMat = getMaterial('canopy', { color: 0x222233, roughness: 0.7 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, BASE_HEIGHT + 2.8, spec.depth / 2 + 0.6);
  group.add(canopy);

  // Glass door
  const doorGeo = new THREE.BoxGeometry(1.2, 2.4, 0.1);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.5,
    roughness: 0.05,
    metalness: 0.2,
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, BASE_HEIGHT + 1.2, spec.depth / 2 + 0.05);
  group.add(door);
}

function addBalconies(group: THREE.Group, spec: BuildingSpec, rng: SeededRNG) {
  const balconyMat = getMaterial('balcony', { color: 0x888899, roughness: 0.8 });
  const railMat = getMaterial('rail', { color: 0x666677, roughness: 0.6, metalness: 0.3 });

  for (let floor = 2; floor < spec.floors; floor += 2) {
    if (rng.next() < 0.5) continue;
    const y = BASE_HEIGHT + floor * FLOOR_HEIGHT + 0.1;
    const bw = spec.width * 0.35;
    const bd = 1.2;

    // Slab
    const slabGeo = new THREE.BoxGeometry(bw, 0.15, bd);
    const slab = new THREE.Mesh(slabGeo, balconyMat);
    slab.position.set(0, y, spec.depth / 2 + bd / 2);
    group.add(slab);

    // Railing
    const railGeo = new THREE.BoxGeometry(bw, 0.6, 0.05);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(0, y + 0.35, spec.depth / 2 + bd);
    group.add(rail);
  }
}
