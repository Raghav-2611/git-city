import * as THREE from 'three';

interface HighwaySignOptions {
  zoneYear: number;
  sectorNumber: number;
  sectorName: string;
}

/**
 * Creates an overhead highway gantry with directional sector signboards spanning across the road.
 */
export function createHighwaySign(options: HighwaySignOptions): THREE.Group {
  const group = new THREE.Group();
  group.rotation.y = Math.PI; // Face oncoming traffic driving along +Z
  const { zoneYear, sectorNumber, sectorName } = options;

  // Metal gantry materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x444455,
    roughness: 0.5,
    metalness: 0.7,
  });

  // 1. Two side support pillars
  const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 9, 8);
  const leftPillar = new THREE.Mesh(pillarGeo, metalMat);
  leftPillar.position.set(-11.5, 4.5, 0);
  leftPillar.castShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, metalMat);
  rightPillar.position.set(11.5, 4.5, 0);
  rightPillar.castShadow = true;
  group.add(rightPillar);

  // 2. Overhead horizontal crossbeam truss
  const beamGeo = new THREE.BoxGeometry(24, 0.4, 0.4);
  const topBeam = new THREE.Mesh(beamGeo, metalMat);
  topBeam.position.set(0, 8.8, 0);
  topBeam.castShadow = true;
  group.add(topBeam);

  const lowerBeam = new THREE.Mesh(beamGeo, metalMat);
  lowerBeam.position.set(0, 7.8, 0);
  lowerBeam.castShadow = true;
  group.add(lowerBeam);

  // Cross struts
  for (let x = -10; x <= 10; x += 2.5) {
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
    const strut = new THREE.Mesh(strutGeo, metalMat);
    strut.position.set(x, 8.3, 0);
    strut.rotation.z = Math.PI / 4;
    group.add(strut);
  }

  // 3. Main Highway Sign Board (Green backdrop with white border)
  const signWidth = 11;
  const signHeight = 2.8;
  const signGeo = new THREE.BoxGeometry(signWidth, signHeight, 0.2);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x004d25, // Classic highway green
    roughness: 0.4,
    metalness: 0.1,
  });

  const signMesh = new THREE.Mesh(signGeo, [
    borderMat, borderMat, borderMat, borderMat,
    signMat, signMat,
  ]);
  signMesh.position.set(-3.5, 8.0, 0);
  group.add(signMesh);

  // Canvas texture for crisp sign text
  const texture = createSignTexture(
    `ZONE ${zoneYear} • SECTOR ${sectorNumber.toString().padStart(2, '0')}`,
    sectorName.toUpperCase(),
    '◄ PREV SECTOR    NEXT SECTOR ►'
  );

  const canvasGeo = new THREE.PlaneGeometry(signWidth - 0.3, signHeight - 0.3);
  const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
  const textMesh = new THREE.Mesh(canvasGeo, canvasMat);
  textMesh.position.set(-3.5, 8.0, 0.12);
  group.add(textMesh);

  // 4. Secondary Speed Limit / Welcome Sign (Right side)
  const speedSignGeo = new THREE.BoxGeometry(3.5, 2.5, 0.2);
  const speedSignMesh = new THREE.Mesh(speedSignGeo, borderMat);
  speedSignMesh.position.set(6.5, 8.0, 0);
  group.add(speedSignMesh);

  const speedTexture = createSpeedTexture(zoneYear);
  const speedCanvasGeo = new THREE.PlaneGeometry(3.2, 2.2);
  const speedCanvasMat = new THREE.MeshBasicMaterial({ map: speedTexture });
  const speedText = new THREE.Mesh(speedCanvasGeo, speedCanvasMat);
  speedText.position.set(6.5, 8.0, 0.12);
  group.add(speedText);

  // 5. Overhead spotlight lamps
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffdd,
    emissive: 0xffffaa,
    emissiveIntensity: 1.5,
  });
  [-6, -1, 6].forEach((lx) => {
    const lampGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(lx, 9.2, 0.4);
    lamp.rotation.x = Math.PI / 6;
    group.add(lamp);
  });

  return group;
}

function createSignTexture(line1: string, line2: string, line3: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Highway green background
  ctx.fillStyle = '#004d25';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Inner reflective white border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Line 1: Zone & Sector Subtitle
  ctx.fillStyle = '#f5c842';
  ctx.font = 'bold 26px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(line1, canvas.width / 2, 60);

  // Line 2: Main Month Name Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Space Grotesk", sans-serif';
  ctx.fillText(line2, canvas.width / 2, 130);

  // Line 3: Arrows
  ctx.fillStyle = '#66ffa3';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(line3, canvas.width / 2, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSpeedTexture(year: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // White sign background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Red circle border
  ctx.strokeStyle = '#dd2222';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 105, 0, Math.PI * 2);
  ctx.stroke();

  // Zone text
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ZONE ${year}`, 128, 80);

  // Speed limit number
  ctx.font = '900 72px sans-serif';
  ctx.fillText('50', 128, 160);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('KM/H', 128, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
