"use client";

import * as React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { readSceneProgress } from "@/lib/three/scene-store";

export interface CameraKeyframe {
  /** 0..1 position along the scene. */
  at: number;
  position: [number, number, number];
  lookAt?: [number, number, number];
}

/**
 * Moves the active camera along keyframes according to a DOM-driven scroll
 * progress (written to the scene store by a PinnedSequence outside the canvas).
 * This is how the visitor "controls the film" with their scroll while GSAP owns
 * the DOM pinning. Uses maath easing for smooth damping.
 */
export function ScrollCamera({
  sceneId,
  keyframes,
  smooth = 0.25,
}: {
  sceneId: string;
  keyframes: CameraKeyframe[];
  smooth?: number;
}) {
  const camera = useThree((s) => s.camera);
  const target = React.useRef(new THREE.Vector3());
  const lookTarget = React.useRef(new THREE.Vector3());
  const sorted = React.useMemo(() => [...keyframes].sort((a, b) => a.at - b.at), [keyframes]);

  useFrame((_, delta) => {
    const p = readSceneProgress(sceneId);
    const { position, lookAt } = sampleKeyframes(sorted, p);
    target.current.set(position[0], position[1], position[2]);
    lookTarget.current.set(lookAt[0], lookAt[1], lookAt[2]);

    easing.damp3(camera.position, target.current, smooth, delta);
    // Smoothly orient toward the look target.
    const desired = new THREE.Quaternion();
    const m = new THREE.Matrix4().lookAt(camera.position, lookTarget.current, camera.up);
    desired.setFromRotationMatrix(m);
    easing.dampQ(camera.quaternion, desired, smooth, delta);
  });

  return null;
}

function sampleKeyframes(
  kfs: CameraKeyframe[],
  p: number,
): { position: [number, number, number]; lookAt: [number, number, number] } {
  if (kfs.length === 0) return { position: [0, 0, 6], lookAt: [0, 0, 0] };
  if (p <= kfs[0].at) return { position: kfs[0].position, lookAt: kfs[0].lookAt ?? [0, 0, 0] };
  const last = kfs[kfs.length - 1];
  if (p >= last.at) return { position: last.position, lookAt: last.lookAt ?? [0, 0, 0] };

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = (p - a.at) / (b.at - a.at || 1);
      return {
        position: lerpVec(a.position, b.position, t),
        lookAt: lerpVec(a.lookAt ?? [0, 0, 0], b.lookAt ?? [0, 0, 0], t),
      };
    }
  }
  return { position: last.position, lookAt: last.lookAt ?? [0, 0, 0] };
}

function lerpVec(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
