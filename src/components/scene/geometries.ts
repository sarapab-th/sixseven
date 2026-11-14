import * as THREE from "three";

/**
 * Hero shapes. Each one is built, centred on X/Z and dropped so its lowest
 * point sits exactly on y = 0 — the print bed. The build animation then just
 * sweeps a clipping plane from 0 up to `height`.
 */

export interface HeroShape {
  id: string;
  geometry: THREE.BufferGeometry;
  height: number;
  /** Largest bounding dimension — a flat gear and a tall knot can then be
   *  scaled to the same on-screen footprint. */
  maxDim: number;
  /** Rotations per second while it turns on the bed */
  spin: number;
}

function seat(geometry: THREE.BufferGeometry): { height: number; maxDim: number } {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -box.min.y, -center.z);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);
  return { height: size.y, maxDim: Math.max(size.x, size.y, size.z) };
}

/** A spur gear — the part people actually come to us for. */
function gearGeometry(teeth = 16, radius = 1.05, toothDepth = 0.2, bore = 0.3): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const root = radius - toothDepth;
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    // A trapezoidal tooth: up the flank, across the tip, back down.
    const pts: [number, number][] = [
      [root, a0],
      [radius, a0 + step * 0.14],
      [radius, a0 + step * 0.36],
      [root, a0 + step * 0.5],
      [root, a0 + step * 0.99],
    ];
    for (const [r, a] of pts) {
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0 && r === root && a === a0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  // Four lightening holes, like a real printed gear
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const h = new THREE.Path();
    h.absarc(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.17, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2); // extrusion runs along Z; stand it up on the bed
  return geo;
}

/** A knot — the thing every slicer demo prints, and it looks the part. */
function knotGeometry(): THREE.BufferGeometry {
  const geo = new THREE.TorusKnotGeometry(0.72, 0.24, 180, 28, 2, 3);
  return geo;
}

/** A faceted shell — reads as "resin detail" next to the chunky gear. */
function shellGeometry(): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(1.05, 1);
}

/** A bracket with a mounting hole — the "spare part" story. */
function bracketGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.9, -0.55);
  shape.lineTo(0.9, -0.55);
  shape.lineTo(0.9, -0.15);
  shape.lineTo(-0.35, -0.15);
  shape.lineTo(-0.35, 0.9);
  shape.lineTo(-0.9, 0.9);
  shape.closePath();

  for (const [cx, cy] of [[0.55, -0.35], [-0.62, 0.55]] as const) {
    const h = new THREE.Path();
    h.absarc(cx, cy, 0.14, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.4,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
    curveSegments: 20,
  });
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(Math.PI / 6);
  return geo;
}

export function buildHeroShapes(): HeroShape[] {
  const defs: { id: string; geometry: THREE.BufferGeometry; spin: number }[] = [
    { id: "gear", geometry: gearGeometry(), spin: 0.09 },
    { id: "knot", geometry: knotGeometry(), spin: 0.12 },
    { id: "bracket", geometry: bracketGeometry(), spin: 0.08 },
    { id: "shell", geometry: shellGeometry(), spin: 0.1 },
  ];

  return defs.map((d) => {
    const { height, maxDim } = seat(d.geometry);
    return { id: d.id, geometry: d.geometry, height, maxDim, spin: d.spin };
  });
}
