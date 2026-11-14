"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { buildHeroShapes, type HeroShape } from "./geometries";
import { createLayerMaterial } from "./layerMaterial";

const CYAN = "#00e5ff";
const MAGENTA = "#ff2e88";
const CAMERA_Z = 9;

export interface DriftingPartsProps {
  /** How many parts are in the air at once */
  count?: number;
  /** Seconds for one part to cross the frame — higher is calmer */
  seconds?: number;
  /** Vertical spread as a fraction of the canvas height (0–1) */
  spread?: number;
  /**
   * How tall a part is relative to the canvas. A short header band wants a
   * big fraction (~0.4); a tall background block wants a small one (~0.12).
   */
  sizeFraction?: number;
  reducedMotion?: boolean;
}

/** Deterministic PRNG, so the arrangement is the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Part {
  shape: HeroShape;
  /** Multiplier on `sizeFraction`, so the parts are not all one size */
  sizeJitter: number;
  /** Vertical position as a fraction of the canvas height, -0.5 to 0.5 */
  yFraction: number;
  z: number;
  /** Where it starts along its track, 0–1 */
  phase: number;
  spin: [number, number, number];
  /** Starting orientation, so they are not all aligned */
  tilt: [number, number, number];
  drift: number;
  accent: string;
}

function Field({
  count = 7,
  seconds = 34,
  spread = 0.72,
  sizeFraction = 0.3,
  reducedMotion = false,
}: DriftingPartsProps) {
  const shapes = useMemo(() => buildHeroShapes(), []);
  const { viewport, size } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const time = useRef(0);

  // Finished parts: layers baked in, no nozzle glow, lit from the sides.
  const material = useMemo(() => {
    const m = createLayerMaterial({
      color: "#8d97a8",
      layerHeight: 0.04,
      hotColor: CYAN,
      clippingPlanes: [],
      anchor: "object",
    });
    m.layerUniforms.uHotStrength.value = 0;
    m.layerUniforms.uBuildHeight.value = -1e6;
    m.side = THREE.FrontSide;
    m.metalness = 0.45;
    m.roughness = 0.34;
    m.emissive = new THREE.Color("#0e1b26");
    return m;
  }, []);

  useEffect(() => () => { material.dispose(); }, [material]);

  // Positions and sizes are stored as fractions of the canvas, then resolved
  // against the live viewport every frame — so a resize never rebuilds the
  // array and the parts never jump.
  const parts = useMemo<Part[]>(() => {
    const rand = mulberry32(6700);
    return Array.from({ length: count }, (_, i) => ({
      shape: shapes[i % shapes.length],
      sizeJitter: 0.75 + rand() * 0.5,
      yFraction: (rand() - 0.5) * spread,
      z: -1 - rand() * 3.5,
      // Evenly spaced along the track, not randomly placed: random phases
      // leave gaps, and a gap wide enough to empty the frame can sit there
      // for half a minute.
      phase: (i + rand() * 0.45) / count,
      spin: [(rand() - 0.5) * 0.34, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.26],
      tilt: [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2],
      drift: 0.92 + rand() * 0.16,
      accent: i % 2 === 0 ? CYAN : MAGENTA,
    }));
  }, [shapes, count, spread]);

  const edges = useMemo(
    () => shapes.map((s) => new THREE.EdgesGeometry(s.geometry, 26)),
    [shapes],
  );
  useEffect(() => () => { edges.forEach((e) => e.dispose()); }, [edges]);

  const phoneScale = size.width < 640 ? 0.62 : 1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!reducedMotion) time.current += dt;

    for (let i = 0; i < parts.length; i++) {
      const group = groups.current[i];
      if (!group) continue;
      const part = parts[i];

      // Everything is resolved against the part's own depth: the frame is
      // wider further back, so the track has to be too.
      const depthRatio = (CAMERA_Z - part.z) / CAMERA_Z;
      const frameWidth = viewport.width * depthRatio;
      const frameHeight = viewport.height * depthRatio;

      // Size the part to a fraction of the canvas, whatever shape it is.
      // On a phone-width canvas they shrink, or one part fills the frame and
      // swamps the text sitting over it.
      const target = sizeFraction * phoneScale * part.sizeJitter * viewport.height;
      group.scale.setScalar(target / part.shape.maxDim);

      group.position.y = part.yFraction * frameHeight;

      const span = frameWidth + target * 2.5; // margin so nothing pops at the edges
      const t = (part.phase + (time.current * part.drift) / seconds) % 1;
      group.position.x = -span / 2 + t * span;

      if (!reducedMotion) {
        group.rotation.x += dt * part.spin[0];
        group.rotation.y += dt * part.spin[1];
        group.rotation.z += dt * part.spin[2];
      }
    }
  });

  return (
    <>
      {/* Mostly coloured light, so the parts pick up the brand rather than
          reading as grey props */}
      <ambientLight intensity={0.32} />
      <directionalLight position={[2, 5, 6]} intensity={0.5} />
      <pointLight position={[-7, 3, 5]} intensity={170} distance={28} color={CYAN} />
      <pointLight position={[7, -3, 4]} intensity={150} distance={28} color={MAGENTA} />
      <pointLight position={[0, 1, 7]} intensity={28} distance={18} color="#ffffff" />

      {parts.map((part, i) => {
        const shapeIndex = shapes.indexOf(part.shape);
        return (
          <group
            key={i}
            ref={(node) => { groups.current[i] = node; }}
            position={[0, 0, part.z]}
            rotation={part.tilt}
          >
            {/* Geometry sits on y=0 for the print bed; re-centre it to tumble */}
            <group position-y={-part.shape.height / 2}>
              <mesh geometry={part.shape.geometry} material={material} />
              <lineSegments geometry={edges[shapeIndex]}>
                <lineBasicMaterial
                  color={part.accent}
                  transparent
                  opacity={0.7}
                  toneMapped={false}
                />
              </lineSegments>
            </group>
          </group>
        );
      })}
    </>
  );
}

export default function DriftingParts(props: DriftingPartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Purely decorative, so it renders only while it is actually on screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let onScreen = false;
    const update = () => setVisible(onScreen && document.visibilityState === "visible");

    const io = new IntersectionObserver(
      ([entry]) => { onScreen = entry.isIntersecting; update(); },
      { rootMargin: "200px" },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, CAMERA_Z], fov: 38, near: 0.1, far: 40 }}
      >
        <fog attach="fog" args={["#050507", 12, 22]} />
        <Field {...props} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
