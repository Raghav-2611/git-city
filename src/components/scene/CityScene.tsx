import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

import type { CityData, CityBlock } from '../../types/contribution';
import type { MonthGroup } from '../../systems/DateSystem';
import { DateSystem } from '../../systems/DateSystem';
import { CarController } from '../../systems/CarController';
import { CameraController } from '../../systems/CameraController';
import { TrafficSystem } from '../../systems/TrafficSystem';
import type { TrafficLightSystem } from '../../systems/TrafficLightSystem';
import { InteractionSystem } from '../../systems/InteractionSystem';
import { generateCity } from '../../generators/CityGenerator';
import { useCarControls } from '../../hooks/useCarControls';
import { PlayerCar } from './PlayerCar';

interface InnerSceneProps {
  cityData: CityData;
  onDistrictChange: (district: MonthGroup | null) => void;
  onDateChange: (date: string | null) => void;
  onSpeedChange: (speed: number) => void;
  onNearBlock: (block: CityBlock | null) => void;
  jumpToZ: number | null;
  onJumpConsumed: () => void;
}

function InnerScene({
  cityData,
  onDistrictChange,
  onDateChange,
  onSpeedChange,
  onNearBlock,
  jumpToZ,
  onJumpConsumed,
}: InnerSceneProps) {
  const { camera, scene } = useThree();
  const inputs = useCarControls();
  const carControllerRef = useRef<CarController | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const trafficRef = useRef<TrafficSystem | null>(null);
  const interactionRef = useRef<InteractionSystem | null>(null);
  const dateSystemRef = useRef<DateSystem | null>(null);
  const cityGroupRef = useRef<THREE.Group | null>(null);
  const trafficGroupRef = useRef<THREE.Group>(new THREE.Group());
  const carStateRef = useRef(
    new CarController(new THREE.Vector3(0, 0, -10)).state
  );
  const lastDistrictRef = useRef<number | null>(null);
  const lastBlockRef = useRef<string | null>(null);

  const trafficLightSystemRef = useRef<TrafficLightSystem | null>(null);

  // Build city once
  useEffect(() => {
    // ── City geometry ───────────────────────────────────────────────────────
    const { road, buildings, streetFurniture, trafficLightSystem } = generateCity(cityData);
    trafficLightSystemRef.current = trafficLightSystem;
    const cityGroup = new THREE.Group();
    cityGroup.add(road);
    cityGroup.add(buildings);
    cityGroup.add(streetFurniture);
    scene.add(cityGroup);
    cityGroupRef.current = cityGroup;

    // ── Traffic ─────────────────────────────────────────────────────────────
    const tGroup = trafficGroupRef.current;
    scene.add(tGroup);
    const traffic = new TrafficSystem(cityData.cityLength);
    traffic.createCars(tGroup);
    trafficRef.current = traffic;

    // ── Car ─────────────────────────────────────────────────────────────────
    const startPos = new THREE.Vector3(0, 0, -8);
    const car = new CarController(startPos);
    carControllerRef.current = car;
    carStateRef.current = car.state;

    // ── Camera ──────────────────────────────────────────────────────────────
    const cam = new CameraController();
    cam.snap(camera, startPos, 0);
    cameraControllerRef.current = cam;

    // ── Date system ─────────────────────────────────────────────────────────
    dateSystemRef.current = new DateSystem(cityData);

    // ── Interaction ─────────────────────────────────────────────────────────
    const interaction = new InteractionSystem(cityData.blocks);
    interaction.on((event) => {
      if (event.type === 'enter') {
        if (lastBlockRef.current !== event.block.day.date) {
          lastBlockRef.current = event.block.day.date;
          onNearBlock(event.block);
        }
      } else {
        lastBlockRef.current = null;
        onNearBlock(null);
      }
    });
    interactionRef.current = interaction;

    return () => {
      scene.remove(cityGroup);
      scene.remove(tGroup);
      cityGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      traffic.dispose();
    };
  }, [cityData, scene, camera, onNearBlock]);

  // Handle jump-to-month
  useEffect(() => {
    if (jumpToZ === null) return;
    const car = carControllerRef.current;
    if (!car) return;
    car.state.position.z = jumpToZ;
    car.state.velocity = 0;
    cameraControllerRef.current?.snap(camera, car.state.position, car.state.rotation);
    onJumpConsumed();
  }, [jumpToZ, camera, onJumpConsumed]);

  // Keyboard reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        carControllerRef.current?.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); // cap to avoid spiral-of-death on lag
    const car = carControllerRef.current;
    const cam = cameraControllerRef.current;
    const traffic = trafficRef.current;
    const interaction = interactionRef.current;
    const dateSystem = dateSystemRef.current;

    if (!car || !cam) return;

    car.update(inputs.current, dt);
    carStateRef.current = car.state;

    cam.update(camera, car.state.position, car.state.rotation, dt);

    traffic?.update(dt);
    trafficLightSystemRef.current?.update(car.state.position);
    interaction?.update(car.state.position);

    // Broadcast speed
    onSpeedChange(car.state.velocity);

    // Broadcast current date / district
    if (dateSystem) {
      const district = dateSystem.getDistrictAtZ(car.state.position.z);
      if (district?.month !== lastDistrictRef.current) {
        lastDistrictRef.current = district?.month ?? null;
        onDistrictChange(district);
      }

      // Find nearest block date for HUD
      const nearestBlock = cityData.blocks.reduce<CityBlock | null>((best, block) => {
        const dz = Math.abs(block.worldZ - car.state.position.z);
        if (!best) return block;
        const bestDz = Math.abs(best.worldZ - car.state.position.z);
        return dz < bestDz ? block : best;
      }, null);

      if (nearestBlock) {
        onDateChange(nearestBlock.day.date);
      }
    }
  });

  return <PlayerCar carState={{ current: carStateRef.current }} />;
}

// ─── Lighting sub-component ───────────────────────────────────────────────────

function SceneLighting() {
  return (
    <>
      {/* Golden-hour sun */}
      <directionalLight
        position={[80, 60, -40]}
        intensity={2.0}
        color="#ffd580"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={300}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-40, 20, 60]}
        intensity={0.5}
        color="#b0d0ff"
      />
      {/* Warm ambient */}
      <ambientLight intensity={0.35} color="#fff0d8" />
      {/* Ground bounce */}
      <hemisphereLight
        args={['#ffeedd', '#334455', 0.3]}
      />
    </>
  );
}

// ─── Public interface ─────────────────────────────────────────────────────────

interface CitySceneProps {
  cityData: CityData;
  onDistrictChange: (district: MonthGroup | null) => void;
  onDateChange: (date: string | null) => void;
  onSpeedChange: (speed: number) => void;
  onNearBlock: (block: CityBlock | null) => void;
  jumpToZ: number | null;
  onJumpConsumed: () => void;
}

export function CityScene(props: CitySceneProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 65, near: 0.5, far: 1200, position: [0, 8, -15] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneLighting />

      <Sky
        distance={450000}
        sunPosition={[1, 0.25, -0.5]}
        inclination={0.52}
        azimuth={0.18}
        turbidity={8}
        rayleigh={1.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.85}
      />

      <fog attach="fog" args={['#c8b090', 120, 500]} />

      <InnerScene {...props} />
    </Canvas>
  );
}
