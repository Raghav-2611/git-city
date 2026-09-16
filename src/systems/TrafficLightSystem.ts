import * as THREE from 'three';

export type SignalState = 'red' | 'yellow' | 'green';

interface TrafficSignal {
  position: THREE.Vector3;
  mesh: THREE.Group;
  redMat: THREE.MeshStandardMaterial;
  yellowMat: THREE.MeshStandardMaterial;
  greenMat: THREE.MeshStandardMaterial;
  state: SignalState;
}

/**
 * Manages 3D traffic light objects placed along the highway.
 * Dynamically switches traffic lights to GREEN as the player car approaches.
 */
export class TrafficLightSystem {
  private signals: TrafficSignal[] = [];

  createSignal(group: THREE.Group, x: number, z: number, initialColor: SignalState = 'red') {
    const signalMesh = new THREE.Group();
    signalMesh.position.set(x, 0, z);

    // Pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.7, metalness: 0.6 });
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 6.5, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.25;
    pole.castShadow = true;
    signalMesh.add(pole);

    // Light Housing
    const boxGeo = new THREE.BoxGeometry(0.7, 2.0, 0.5);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.8 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(0, 5.8, 0);
    box.castShadow = true;
    signalMesh.add(box);

    // Visors around lights
    [-0.55, 0, 0.55].forEach((yOffset) => {
      const visorGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.3, 8, 1, true, -Math.PI / 2, Math.PI);
      const visor = new THREE.Mesh(visorGeo, boxMat);
      visor.position.set(0, 5.8 + yOffset, 0.15);
      visor.rotation.x = Math.PI / 10;
      signalMesh.add(visor);
    });

    // Emissive materials for Red, Yellow, Green
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: initialColor === 'red' ? 0xff1111 : 0x220000,
      emissiveIntensity: initialColor === 'red' ? 1.8 : 0.1,
      roughness: 0.2,
    });

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: initialColor === 'yellow' ? 0xff8800 : 0x221100,
      emissiveIntensity: initialColor === 'yellow' ? 1.8 : 0.1,
      roughness: 0.2,
    });

    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x22ff55,
      emissive: initialColor === 'green' ? 0x00ff44 : 0x002200,
      emissiveIntensity: initialColor === 'green' ? 1.8 : 0.1,
      roughness: 0.2,
    });

    const bulbGeo = new THREE.SphereGeometry(0.18, 12, 12);

    // Red Bulb (Top)
    const redBulb = new THREE.Mesh(bulbGeo, redMat);
    redBulb.position.set(0, 6.35, 0.26);
    signalMesh.add(redBulb);

    // Yellow Bulb (Middle)
    const yellowBulb = new THREE.Mesh(bulbGeo, yellowMat);
    yellowBulb.position.set(0, 5.8, 0.26);
    signalMesh.add(yellowBulb);

    // Green Bulb (Bottom)
    const greenBulb = new THREE.Mesh(bulbGeo, greenMat);
    greenBulb.position.set(0, 5.25, 0.26);
    signalMesh.add(greenBulb);

    group.add(signalMesh);

    this.signals.push({
      position: new THREE.Vector3(x, 0, z),
      mesh: signalMesh,
      redMat,
      yellowMat,
      greenMat,
      state: initialColor,
    });
  }

  /** Dynamically update signals based on car distance */
  update(carPos: THREE.Vector3) {
    for (const sig of this.signals) {
      const dz = sig.position.z - carPos.z;

      // When car is approaching within 40 units ahead, turn signal to GREEN!
      if (dz > 0 && dz < 40) {
        this.setSignalState(sig, 'green');
      } else if (dz > -15 && dz <= 0) {
        this.setSignalState(sig, 'green');
      } else {
        // Default to red signal until player approaches
        this.setSignalState(sig, 'red');
      }
    }
  }

  private setSignalState(sig: TrafficSignal, state: SignalState) {
    if (sig.state === state) return;
    sig.state = state;

    sig.redMat.emissive.setHex(state === 'red' ? 0xff1111 : 0x220000);
    sig.redMat.emissiveIntensity = state === 'red' ? 1.8 : 0.1;

    sig.yellowMat.emissive.setHex(state === 'yellow' ? 0xff8800 : 0x221100);
    sig.yellowMat.emissiveIntensity = state === 'yellow' ? 1.8 : 0.1;

    sig.greenMat.emissive.setHex(state === 'green' ? 0x00ff44 : 0x002200);
    sig.greenMat.emissiveIntensity = state === 'green' ? 1.8 : 0.1;
  }
}
