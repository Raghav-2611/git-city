import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CarState } from '../../systems/CarController';

interface PlayerCarProps {
  carState: React.MutableRefObject<CarState>;
}

// Shared materials
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc87941, roughness: 0.35, metalness: 0.5 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.6 });
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.65,
  roughness: 0.05,
  metalness: 0.1,
});
const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xaaaacc, roughness: 0.3, metalness: 0.7 });
const lightMat = new THREE.MeshStandardMaterial({
  color: 0xfff5dd,
  emissive: 0xfff0aa,
  emissiveIntensity: 1.5,
});
const brakeMatOn = new THREE.MeshStandardMaterial({
  color: 0xff1100,
  emissive: 0xff0000,
  emissiveIntensity: 2.0,
});

export function PlayerCar({ carState }: PlayerCarProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const frontWheelGroupRefs = useRef<THREE.Group[]>([]);

  useFrame(() => {
    const state = carState.current;
    if (!groupRef.current) return;

    // Position and rotation
    groupRef.current.position.copy(state.position);
    groupRef.current.position.y = 0.38; // keep on road
    groupRef.current.rotation.y = state.rotation;

    // Spin all wheels by velocity
    for (const wheel of wheelRefs.current) {
      wheel.rotation.x = state.wheelRotation;
    }

    // Steer front wheels (visual only)
    for (const fwg of frontWheelGroupRefs.current) {
      fwg.rotation.y = state.steerAngle * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Main body ────────────────────────────────────── */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[2.1, 0.75, 4.5]} />
      </mesh>

      {/* ── Cabin ────────────────────────────────────────── */}
      <mesh position={[0, 0.95, -0.15]} castShadow material={bodyMat}>
        <boxGeometry args={[1.8, 0.65, 2.3]} />
      </mesh>

      {/* ── Windshield front ─────────────────────────────── */}
      <mesh position={[0, 0.9, 0.98]} material={glassMat}>
        <boxGeometry args={[1.7, 0.55, 0.06]} />
      </mesh>
      {/* ── Rear window ──────────────────────────────────── */}
      <mesh position={[0, 0.9, -1.27]} material={glassMat}>
        <boxGeometry args={[1.7, 0.55, 0.06]} />
      </mesh>
      {/* Side windows */}
      <mesh position={[0.93, 0.9, -0.15]} rotation={[0, Math.PI / 2, 0]} material={glassMat}>
        <boxGeometry args={[1.8, 0.5, 0.06]} />
      </mesh>
      <mesh position={[-0.93, 0.9, -0.15]} rotation={[0, Math.PI / 2, 0]} material={glassMat}>
        <boxGeometry args={[1.8, 0.5, 0.06]} />
      </mesh>

      {/* ── Front headlights ─────────────────────────────── */}
      <mesh position={[0.65, 0.4, 2.26]} material={lightMat}>
        <boxGeometry args={[0.45, 0.18, 0.06]} />
      </mesh>
      <mesh position={[-0.65, 0.4, 2.26]} material={lightMat}>
        <boxGeometry args={[0.45, 0.18, 0.06]} />
      </mesh>

      {/* ── Rear brake lights ────────────────────────────── */}
      <mesh position={[0.65, 0.4, -2.26]} material={brakeMatOn}>
        <boxGeometry args={[0.45, 0.18, 0.06]} />
      </mesh>
      <mesh position={[-0.65, 0.4, -2.26]} material={brakeMatOn}>
        <boxGeometry args={[0.45, 0.18, 0.06]} />
      </mesh>

      {/* ── Bumpers ──────────────────────────────────────── */}
      <mesh position={[0, 0.2, 2.3]} material={darkMat}>
        <boxGeometry args={[2.0, 0.3, 0.2]} />
      </mesh>
      <mesh position={[0, 0.2, -2.3]} material={darkMat}>
        <boxGeometry args={[2.0, 0.3, 0.2]} />
      </mesh>

      {/* ── Wheels ───────────────────────────────────────── */}
      {/* Front-left */}
      <group ref={(el) => { if (el) frontWheelGroupRefs.current[0] = el; }} position={[-1.15, 0.32, 1.4]}>
        <mesh
          ref={(el) => { if (el) wheelRefs.current[0] = el; }}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          material={tireMat}
        >
          <cylinderGeometry args={[0.33, 0.33, 0.22, 12]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
          <cylinderGeometry args={[0.2, 0.2, 0.24, 8]} />
        </mesh>
      </group>

      {/* Front-right */}
      <group ref={(el) => { if (el) frontWheelGroupRefs.current[1] = el; }} position={[1.15, 0.32, 1.4]}>
        <mesh
          ref={(el) => { if (el) wheelRefs.current[1] = el; }}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          material={tireMat}
        >
          <cylinderGeometry args={[0.33, 0.33, 0.22, 12]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
          <cylinderGeometry args={[0.2, 0.2, 0.24, 8]} />
        </mesh>
      </group>

      {/* Rear-left */}
      <group position={[-1.15, 0.32, -1.4]}>
        <mesh
          ref={(el) => { if (el) wheelRefs.current[2] = el; }}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          material={tireMat}
        >
          <cylinderGeometry args={[0.33, 0.33, 0.22, 12]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
          <cylinderGeometry args={[0.2, 0.2, 0.24, 8]} />
        </mesh>
      </group>

      {/* Rear-right */}
      <group position={[1.15, 0.32, -1.4]}>
        <mesh
          ref={(el) => { if (el) wheelRefs.current[3] = el; }}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          material={tireMat}
        >
          <cylinderGeometry args={[0.33, 0.33, 0.22, 12]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
          <cylinderGeometry args={[0.2, 0.2, 0.24, 8]} />
        </mesh>
      </group>
    </group>
  );
}
