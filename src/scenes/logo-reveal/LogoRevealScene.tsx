"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { CameraRig } from "@/components/three/CameraRig";
import { EnvironmentRig } from "@/components/three/EnvironmentRig";
import { LogoStage } from "@/components/three/stages";
import { PostFX } from "@/components/three/PostFX";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Inner R3F content for the "logo reveal" demo: a metallic primitive emblem
 * that catches the studio environment. No brand asset — pure primitives.
 * Mount inside <AdaptiveCanvas>.
 */
export function LogoRevealScene() {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    if (reduced || !meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.35;
    meshRef.current.rotation.x += delta * 0.1;
  });

  return (
    <>
      <CameraRig position={[0, 0, 5]} fov={40} />
      <ambientLight intensity={0.2} />
      <React.Suspense fallback={null}>
        <EnvironmentRig intensity={1.2} />
      </React.Suspense>
      <LogoStage>
        <mesh ref={meshRef} castShadow>
          <torusKnotGeometry args={[1, 0.34, 220, 32]} />
          <meshStandardMaterial color="#c9ccd6" metalness={1} roughness={0.12} />
        </mesh>
      </LogoStage>
      <PostFX />
    </>
  );
}
