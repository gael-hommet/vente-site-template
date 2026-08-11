"use client";

import * as React from "react";
import * as THREE from "three";
import { useLoader, useThree } from "@react-three/fiber";
import type { DepthSettings, SpatialScene } from "./types";
import { sceneScale } from "./layout";

/**
 * ACE SPATIAL CINEMA — maillage de profondeur (vraie géométrie WebGL).
 *
 * L'image n'est PAS collée sur un plan plat : elle habille un maillage très
 * subdivisé dont chaque sommet est déplacé en Z par la carte de profondeur.
 * Le premier plan avance vers la caméra, le fond recule — c'est ce qui produit
 * un parallaxe et une perspective RÉELS quand la caméra se déplace.
 *
 * Le déplacement a lieu dans le VERTEX shader (gratuit côté GPU, aucune
 * dépendance externe).
 */

const vertexShader = /* glsl */ `
  uniform sampler2D uDepth;
  uniform float uStrength;
  uniform float uNear;
  uniform float uFar;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vUv = uv;
    // La depth map est en niveaux de gris : 1 = proche, 0 = loin.
    float d = texture2D(uDepth, uv).r;
    // Remappe dans la plage utile, puis déplace le sommet vers la caméra.
    float mapped = mix(uFar, uNear, clamp(d, 0.0, 1.0));
    vDepth = mapped;
    vec3 displaced = position + normal * mapped * uStrength;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uDarken;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    // Assombrissement des plans lointains : renforce la lecture de la profondeur.
    float shade = mix(0.82, 1.0, clamp(vDepth, 0.0, 1.0));
    vec3 color = tex.rgb * shade * (1.0 - uDarken);
    gl_FragColor = vec4(color, tex.a * uOpacity);
  }
`;

export interface DepthMeshProps {
  image: string;
  depthMap: string;
  depth: DepthSettings;
  /** Opacité — utilisée UNIQUEMENT pendant la fenêtre masquée d'un raccord. */
  opacity?: number;
  /** Assombrissement (traversée d'une zone sombre). */
  darken?: number;
  /** Subdivision du maillage. Réduite sur mobile. */
  segments?: number;
  /**
   * Scène d'origine : sert à dimensionner le plan pour qu'il couvre l'écran
   * quel que soit le format (pas de bord vide).
   */
  scene: SpatialScene;
  position?: [number, number, number];
  visible?: boolean;
}

/**
 * Un plan très subdivisé, texturé et déformé par la profondeur.
 * `segments` pilote directement le coût GPU : 192 sur desktop, 96 sur mobile.
 */
export function DepthMesh({
  image,
  depthMap,
  depth,
  opacity = 1,
  darken = 0,
  segments = 192,
  scene,
  position = [0, 0, 0],
  visible = true,
}: DepthMeshProps) {
  const [map, depthTex] = useLoader(THREE.TextureLoader, [image, depthMap]);
  const material = React.useRef<THREE.ShaderMaterial>(null);
  // Le plan est taillé pour le cadre courant : aucun bord ne peut apparaître.
  const aspect = useThree((s) => s.viewport.aspect);
  const scale = React.useMemo(() => sceneScale(scene, aspect), [scene, aspect]);

  // Un maillage plat aurait un `normal` en +Z : le déplacement se fait donc
  // bien vers la caméra, sans calcul supplémentaire.
  const uniforms = React.useMemo(
    () => ({
      uMap: { value: map },
      uDepth: { value: depthTex },
      uStrength: { value: depth.strength },
      uNear: { value: depth.near },
      uFar: { value: depth.far },
      uOpacity: { value: opacity },
      uDarken: { value: darken },
    }),
    // Les valeurs vivantes sont poussées ci-dessous ; on ne recrée pas l'objet.
    [map, depthTex, depth.strength, depth.near, depth.far], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Mise à jour sans recompiler le shader : on passe par le matériau monté,
  // jamais par l'objet mémoïsé.
  React.useEffect(() => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uOpacity.value = opacity;
    u.uDarken.value = darken;
  }, [opacity, darken]);

  React.useEffect(() => {
    for (const t of [map, depthTex]) {
      t.colorSpace = t === map ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    }
  }, [map, depthTex]);

  return (
    <mesh position={position} visible={visible}>
      <planeGeometry args={[scale[0], scale[1], segments, segments]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

/** Nombre de subdivisions selon le tier de qualité (coût GPU maîtrisé). */
export function segmentsForTier(tier: "ULTRA" | "BALANCED" | "LITE"): number {
  return tier === "ULTRA" ? 224 : tier === "BALANCED" ? 144 : 80;
}
