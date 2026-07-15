"use client";

import * as React from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { ScrollCamera, type CameraKeyframe } from "@/components/three/ScrollCamera";
import { EnvironmentRig } from "@/components/three/EnvironmentRig";
import { PostFX } from "@/components/three/PostFX";

/** Scene id used to bridge DOM scroll progress → this canvas via the store. */
export const VEHICLE_JOURNEY_ID = "vehicle-journey";

/** Camera flies down a corridor of primitive pillars as scroll drives progress. */
const KEYFRAMES: CameraKeyframe[] = [
  { at: 0, position: [0, 1.4, 10], lookAt: [0, 1, 0] },
  { at: 0.4, position: [2, 1.2, 2], lookAt: [0, 1, -6] },
  { at: 0.7, position: [-2, 1.6, -6], lookAt: [0, 1, -14] },
  { at: 1, position: [0, 2.4, -16], lookAt: [0, 0.5, -24] },
];

function Pillar({ z, x }: { z: number; x: number }) {
  return (
    <mesh position={[x, 0, z]} castShadow>
      <boxGeometry args={[0.6, 3.2, 0.6]} />
      <meshStandardMaterial color="#2a3350" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

/**
 * Inner R3F content for the scroll-controlled "journey" demo. The visitor
 * controls the camera path by scrolling (DOM pin owned by GSAP, camera owned by
 * R3F) — the core "cinematic controlled by scroll" pattern, with primitives.
 */
export function VehicleJourneyScene() {
  const pillars = React.useMemo(() => {
    const items: { x: number; z: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const z = -i * 2.5;
      items.push({ x: -2.2, z }, { x: 2.2, z });
    }
    return items;
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.4, 10]} fov={55} />
      <ScrollCamera sceneId={VEHICLE_JOURNEY_ID} keyframes={KEYFRAMES} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 8, 4]} intensity={1} castShadow />
      <React.Suspense fallback={null}>
        <EnvironmentRig intensity={0.8} />
      </React.Suspense>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, -14]} receiveShadow>
        <planeGeometry args={[40, 80]} />
        <meshStandardMaterial color="#12162a" roughness={0.9} />
      </mesh>

      {pillars.map((p, i) => (
        <Pillar key={i} x={p.x} z={p.z} />
      ))}

      <PostFX />
    </>
  );
}
