"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import { buildHeroShapes, type HeroShape } from "@/components/scene/geometries";
import { createLayerMaterial } from "@/components/scene/layerMaterial";

const CYAN = "#00e5ff";
const MAGENTA = "#ff2e88";
const EDGE_OPACITY = 0.22;
const PRINT_SECONDS = 7;   // how long one part takes to build
const HOLD_SECONDS = 3.2;  // how long it sits finished before the next one
const CLEAR_SECONDS = 0.8; // the finished part fading off the bed

/* ------------------------------------------------------------------ */

function PrintBed() {
  return (
    <group>
      <Grid
        position={[0, 0.001, 0]}
        args={[24, 24]}
        cellSize={0.4}
        cellThickness={0.6}
        cellColor="#1d2b33"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#0f4d5c"
        fadeDistance={16}
        fadeStrength={1.4}
        infiniteGrid
        followCamera={false}
      />
      {/* The plate itself, catching a little of the neon */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[2.6, 64]} />
        <meshStandardMaterial color="#0a0e12" metalness={0.5} roughness={0.65} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[2.55, 2.6, 64]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}

export interface HeadState { y: number; active: boolean }

/** The glowing line where the nozzle is working right now. */
function PrintHead({ state }: { state: React.RefObject<HeadState> }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (!ref.current) return;
    // Ease the head towards the target so it never snaps between frames
    const { y, active } = state.current;
    ref.current.position.y += (y - ref.current.position.y) * Math.min(1, dt * 12);
    const target = active ? 1 : 0;
    ref.current.scale.x += (target - ref.current.scale.x) * Math.min(1, dt * 6);
    ref.current.scale.z = ref.current.scale.x;
  });

  return (
    <group ref={ref}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.28, 1.33, 64]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.5, 48]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */

function PrintingPart({ reducedMotion }: { reducedMotion: boolean }) {
  const shapes = useMemo(() => buildHeroShapes(), []);
  const [index, setIndex] = useState(0);
  const shape: HeroShape = shapes[index];

  const group = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const phase = useRef<"printing" | "holding" | "clearing">(reducedMotion ? "holding" : "printing");
  const elapsed = useRef(0);
  const head = useRef<HeadState>({ y: 0, active: !reducedMotion });

  // One plane, reused: everything above it is cut away.
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);

  const material = useMemo(
    () =>
      createLayerMaterial({
        color: "#d8dde6",
        layerHeight: 0.034,
        hotColor: MAGENTA,
        clippingPlanes: [plane],
      }),
    [plane],
  );

  const edges = useMemo(() => new THREE.EdgesGeometry(shape.geometry, 24), [shape.geometry]);

  // A new shape always starts solid, whatever the fade left behind
  useEffect(() => {
    material.transparent = false;
    material.opacity = 1;
  }, [material, index]);

  useEffect(() => () => { material.dispose(); }, [material]);
  useEffect(() => () => { edges.dispose(); }, [edges]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); // a backgrounded tab can hand us a huge delta

    if (reducedMotion) {
      plane.constant = shape.height + 0.01;
      material.layerUniforms.uBuildHeight.value = shape.height;
      return;
    }

    elapsed.current += dt;
    const line = lineRef.current?.material as THREE.LineBasicMaterial | undefined;

    if (phase.current === "printing") {
      const t = Math.min(1, elapsed.current / PRINT_SECONDS);
      // Ease out near the top so the last layers feel deliberate
      const eased = 1 - Math.pow(1 - t, 1.6);
      const y = eased * shape.height;

      plane.constant = y + 0.004;
      material.layerUniforms.uBuildHeight.value = y;
      head.current.y = y;
      head.current.active = true;

      if (t >= 1) {
        phase.current = "holding";
        elapsed.current = 0;
        head.current.active = false;
      }
    } else if (phase.current === "holding") {
      plane.constant = shape.height + 0.01;
      material.layerUniforms.uBuildHeight.value = shape.height + 1;

      if (elapsed.current >= HOLD_SECONDS) {
        phase.current = "clearing";
        elapsed.current = 0;
      }
    } else {
      // Fade the finished part off the bed rather than letting it vanish
      const t = Math.min(1, elapsed.current / CLEAR_SECONDS);
      material.transparent = true;
      material.opacity = 1 - t;
      if (line) line.opacity = EDGE_OPACITY * (1 - t);

      if (t >= 1) {
        material.transparent = false;
        material.opacity = 1;
        if (line) line.opacity = EDGE_OPACITY;
        phase.current = "printing";
        elapsed.current = 0;
        head.current.y = 0;
        setIndex((i) => (i + 1) % shapes.length);
      }
    }

    if (group.current) {
      group.current.rotation.y += dt * shape.spin * Math.PI * 2;
    }
  });

  return (
    <>
      <group ref={group} position-y={0.02}>
        <mesh geometry={shape.geometry} material={material} castShadow />
        <lineSegments geometry={edges} ref={lineRef}>
          <lineBasicMaterial
            color={CYAN}
            transparent
            opacity={EDGE_OPACITY}
            clippingPlanes={[plane]}
            toneMapped={false}
          />
        </lineSegments>
      </group>
      <PrintHead state={head} />
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Small wireframe shapes drifting in the background. */
function Drifters() {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      [
        { p: [-2.5, 1.9, -1.4], s: 0.26, c: CYAN },
        { p: [2.7, 2.5, -0.9], s: 0.19, c: MAGENTA },
        { p: [2.1, 0.75, 1.9], s: 0.15, c: CYAN },
        { p: [-2.2, 0.5, 1.6], s: 0.22, c: MAGENTA },
      ] as const,
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      child.position.y = items[i].p[1] + Math.sin(t * 0.5 + i * 1.7) * 0.18;
      child.rotation.x = t * 0.15 + i;
      child.rotation.z = t * 0.1 + i;
    });
  });

  return (
    <group ref={ref}>
      {items.map((item, i) => (
        <mesh key={i} position={item.p as unknown as [number, number, number]}>
          <icosahedronGeometry args={[item.s, 0]} />
          <meshBasicMaterial color={item.c} wireframe transparent opacity={0.3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Nudges the camera towards the pointer, just enough to feel alive. */
function CameraRig({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.85, 0), []);
  const base = useMemo(() => new THREE.Vector3(3.2, 2.5, 4.35), []);

  useFrame((state, delta) => {
    const k = Math.min(1, delta * 2.2);
    const x = enabled ? state.pointer.x : 0;
    const y = enabled ? state.pointer.y : 0;
    camera.position.x += (base.x + x * 0.55 - camera.position.x) * k;
    camera.position.y += (base.y + y * 0.35 - camera.position.y) * k;
    camera.position.z = base.z;
    camera.lookAt(target);
  });

  return null;
}

/* ------------------------------------------------------------------ */

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Stop rendering entirely when the hero is scrolled past or the tab is hidden
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let onScreen = true;
    const update = () => setVisible(onScreen && document.visibilityState === "visible");

    const io = new IntersectionObserver(
      ([entry]) => { onScreen = entry.isIntersecting; update(); },
      { rootMargin: "120px" },
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
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          localClippingEnabled: true,
        }}
        camera={{ position: [3.2, 2.5, 4.35], fov: 34, near: 0.1, far: 60 }}
      >
        <color attach="background" args={["#050507"]} />
        <fog attach="fog" args={["#050507", 7, 18]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 6, 4]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-3.2, 1.6, 2]} intensity={28} distance={12} color={CYAN} />
        <pointLight position={[3.4, 1.2, -1.6]} intensity={24} distance={12} color={MAGENTA} />
        <pointLight position={[0, 3.4, 0]} intensity={10} distance={9} color="#ffffff" />

        <PrintBed />
        <PrintingPart reducedMotion={reducedMotion} />
        {!reducedMotion && <Drifters />}
        <CameraRig enabled={!reducedMotion} />

        <EffectComposer enableNormalPass={false}>
          <Bloom intensity={0.85} luminanceThreshold={0.28} luminanceSmoothing={0.5} mipmapBlur />
          <Vignette offset={0.28} darkness={0.72} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
