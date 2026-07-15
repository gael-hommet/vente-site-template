"use client";

import * as React from "react";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";

export interface CameraRigProps {
  position?: [number, number, number];
  fov?: number;
  /** Allow user orbit (drag). Disabled by default for scroll-driven scenes. */
  controls?: boolean;
  target?: [number, number, number];
  children?: React.ReactNode;
}

/** Declarative camera + optional damped orbit controls. */
export function CameraRig({
  position = [0, 0, 6],
  fov = 45,
  controls = false,
  target = [0, 0, 0],
  children,
}: CameraRigProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={position} fov={fov} />
      {controls && (
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          target={target}
          makeDefault
        />
      )}
      {children}
    </>
  );
}
