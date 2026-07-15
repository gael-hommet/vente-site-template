"use client";

import * as React from "react";
import { Center, ContactShadows, Float } from "@react-three/drei";
import { useQuality } from "@/hooks/useQuality";

interface StageProps {
  children: React.ReactNode;
}

/**
 * ProductStage — centers a product, adds contact shadows and a gentle float.
 * Good for a single hero object (bottle, device, package).
 */
export function ProductStage({ children, float = true }: StageProps & { float?: boolean }) {
  const { budget } = useQuality();
  const content = <Center>{children}</Center>;
  return (
    <group>
      {float ? (
        <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.5}>
          {content}
        </Float>
      ) : (
        content
      )}
      {budget.shadows && (
        <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={8} blur={2.5} far={4} />
      )}
    </group>
  );
}

/**
 * VehicleStage — wider ground contact + turntable friendliness for large
 * objects (vehicles, furniture). Uses a real primitive placeholder in the lab.
 */
export function VehicleStage({ children }: StageProps) {
  const { budget } = useQuality();
  return (
    <group>
      <Center>{children}</Center>
      {budget.shadows && (
        <ContactShadows position={[0, -1, 0]} opacity={0.55} scale={14} blur={2} far={6} />
      )}
    </group>
  );
}

/**
 * LogoStage — a floating, softly lit stage for a logo/emblem primitive.
 */
export function LogoStage({ children }: StageProps) {
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <Center>{children}</Center>
    </Float>
  );
}
