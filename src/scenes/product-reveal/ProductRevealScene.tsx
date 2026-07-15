"use client";

import * as React from "react";
import { RoundedBox } from "@react-three/drei";
import { CameraRig } from "@/components/three/CameraRig";
import { EnvironmentRig } from "@/components/three/EnvironmentRig";
import { ProductStage } from "@/components/three/stages";
import { Hotspot } from "@/components/three/Hotspot";
import { PostFX } from "@/components/three/PostFX";

/**
 * Inner R3F content for the "product reveal" demo: an orbitable primitive
 * "product" with accessible hotspots. Replace the primitive with a <Model> for
 * a real GLB. Mount inside <AdaptiveCanvas>.
 */
export function ProductRevealScene() {
  return (
    <>
      <CameraRig position={[2.5, 1.5, 4]} fov={42} controls />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow />
      <React.Suspense fallback={null}>
        <EnvironmentRig intensity={1} />
      </React.Suspense>
      <ProductStage float={false}>
        <group>
          <RoundedBox args={[1.4, 2.2, 0.6]} radius={0.12} smoothness={6} castShadow>
            <meshStandardMaterial color="#3b4a6b" metalness={0.4} roughness={0.25} />
          </RoundedBox>
          <Hotspot
            position={[0.8, 0.9, 0.4]}
            label="Finition premium"
            description="Matériau et reflets pilotés par l'environnement."
          />
          <Hotspot
            position={[-0.8, -0.6, 0.4]}
            label="Détail produit"
            description="Placez ici un point d'intérêt réel."
          />
        </group>
      </ProductStage>
      <PostFX />
    </>
  );
}
