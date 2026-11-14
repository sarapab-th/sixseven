"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { createLayerMaterial } from "@/components/scene/layerMaterial";

export type ViewMode = "solid" | "wireframe" | "layers";

interface ModelViewerProps {
  geometry: THREE.BufferGeometry;
  /** Layer height expressed in the geometry's own units */
  layerHeightInUnits: number;
  mode: ViewMode;
  /** Resin parts get the magenta treatment, FDM the cyan */
  accent: "cyan" | "magenta";
}

const ACCENTS = { cyan: "#00e5ff", magenta: "#ff2e88" } as const;

function Model({ geometry, layerHeightInUnits, mode, accent }: ModelViewerProps) {
  const group = useRef<THREE.Group>(null);

  // Normalise so any model — a 3 mm bolt or a 300 mm helmet — frames the same
  const { scale, offset, height } = useMemo(() => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 1.7 / maxDim;
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x, -box.min.y, -center.z),
      height: size.y,
    };
  }, [geometry]);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6), []);

  const material = useMemo(
    () =>
      createLayerMaterial({
        color: "#d9dee7",
        // World-space layer height, so the preview shows the real layer count
        layerHeight: Math.max(layerHeightInUnits * scale, 0.0006),
        hotColor: ACCENTS[accent],
        clippingPlanes: [plane],
      }),
    [layerHeightInUnits, scale, accent, plane],
  );

  useEffect(() => () => { material.dispose(); }, [material]);

  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 32), [geometry]);
  useEffect(() => () => { edges.dispose(); }, [edges]);

  const progress = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (mode === "layers") {
      progress.current += dt / 6;
      if (progress.current > 1.25) progress.current = 0; // brief pause at the top
      const y = Math.min(1, progress.current) * height * scale;
      plane.constant = y + 0.002;
      material.layerUniforms.uBuildHeight.value = y;
    } else {
      progress.current = 0;
      plane.constant = 1e6;
      material.layerUniforms.uBuildHeight.value = 1e6;
    }

    if (group.current) group.current.rotation.y += dt * 0.28;
  });

  return (
    <group ref={group} position-y={-0.85}>
      <group scale={scale}>
        <mesh geometry={geometry} material={material} position={offset} visible={mode !== "wireframe"} />
        <lineSegments geometry={edges} position={offset}>
          <lineBasicMaterial
            color={ACCENTS[accent]}
            transparent
            opacity={mode === "wireframe" ? 0.85 : 0.18}
            clippingPlanes={[plane]}
            toneMapped={false}
          />
        </lineSegments>
      </group>

      {/* The bed it is standing on */}
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.45, 64]} />
        <meshBasicMaterial color="#0b0f14" transparent opacity={0.85} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001}>
        <ringGeometry args={[1.42, 1.45, 64]} />
        <meshBasicMaterial color={ACCENTS[accent]} transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function ModelViewer(props: ModelViewerProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
      camera={{ position: [0, 0.95, 3.1], fov: 40, near: 0.1, far: 40 }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <pointLight position={[-3, 1.5, 2]} intensity={16} distance={10} color="#00e5ff" />
      <pointLight position={[3, 1, -2]} intensity={14} distance={10} color="#ff2e88" />

      <Model {...props} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.6}
        maxDistance={6}
        maxPolarAngle={Math.PI * 0.52}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
