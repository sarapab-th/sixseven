/**
 * Client-side 3D model analysis.
 *
 * Parses an uploaded STL / OBJ / 3MF / PLY file entirely in the browser and
 * measures it. Nothing is uploaded until the customer asks for a quote, so the
 * price appears instantly and their file stays private until they choose.
 */

import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

export interface MeshStats {
  /** Solid volume of the model in cubic centimetres */
  volumeCm3: number;
  /** Outer surface area in square centimetres */
  surfaceAreaCm2: number;
  /** Bounding box in millimetres */
  size: { x: number; y: number; z: number };
  triangles: number;
  /** True when the surface is not a sealed solid — volume is then unreliable */
  isOpenSurface: boolean;
}

export interface LoadedModel {
  geometry: THREE.BufferGeometry;
  stats: MeshStats;
}

const MM_PER_UNIT: Record<UnitId, number> = { mm: 1, cm: 10, in: 25.4 };
export type UnitId = "mm" | "cm" | "in";

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

/** Merge everything in a loaded Group into one geometry we can measure. */
function flattenToGeometry(object: THREE.Object3D): THREE.BufferGeometry {
  const positions: number[] = [];
  const matrix = new THREE.Matrix4();
  const vertex = new THREE.Vector3();

  object.updateMatrixWorld(true);

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    let geo = mesh.geometry as THREE.BufferGeometry;
    if (geo.index) geo = geo.toNonIndexed();

    const pos = geo.getAttribute("position");
    if (!pos) return;

    matrix.copy(mesh.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos as THREE.BufferAttribute, i);
      vertex.applyMatrix4(matrix);
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  return merged;
}

/**
 * Measure a triangle soup.
 *
 * Volume uses the signed-tetrahedron sum: for a closed surface, the signed
 * volumes of tetrahedra formed between the origin and every triangle cancel
 * out everywhere except inside the solid. If the mesh has holes the signed sum
 * drifts away from the unsigned sum, which is how we detect an open surface.
 */
export function measureGeometry(geometry: THREE.BufferGeometry, unit: UnitId = "mm"): MeshStats {
  let geo = geometry;
  if (geo.index) geo = geo.toNonIndexed();

  const pos = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!pos || pos.count < 3) {
    return { volumeCm3: 0, surfaceAreaCm2: 0, size: { x: 0, y: 0, z: 0 }, triangles: 0, isOpenSurface: true };
  }

  const scale = MM_PER_UNIT[unit];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  let signedVolume = 0;   // mm³
  let absVolume = 0;      // mm³
  let area = 0;           // mm²

  const triangles = Math.floor(pos.count / 3);

  for (let i = 0; i < triangles; i++) {
    a.fromBufferAttribute(pos, i * 3).multiplyScalar(scale);
    b.fromBufferAttribute(pos, i * 3 + 1).multiplyScalar(scale);
    c.fromBufferAttribute(pos, i * 3 + 2).multiplyScalar(scale);

    // Signed volume of the tetrahedron (origin, a, b, c)
    const v = a.dot(cross.copy(b).cross(c)) / 6;
    signedVolume += v;
    absVolume += Math.abs(v);

    ab.copy(b).sub(a);
    ac.copy(c).sub(a);
    area += cross.copy(ab).cross(ac).length() / 2;
  }

  const volumeMm3 = Math.abs(signedVolume);

  // A sealed solid cancels most of the tetrahedra; an open shell does not.
  const cancellation = absVolume > 0 ? volumeMm3 / absVolume : 0;
  const isOpenSurface = cancellation > 0.92 || volumeMm3 < 1e-6;

  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const size = {
    x: (bb.max.x - bb.min.x) * scale,
    y: (bb.max.y - bb.min.y) * scale,
    z: (bb.max.z - bb.min.z) * scale,
  };

  return {
    volumeCm3: volumeMm3 / 1000,
    surfaceAreaCm2: area / 100,
    size,
    triangles,
    isOpenSurface,
  };
}

/** Parse an uploaded file into a geometry plus its measurements. */
export async function loadModelFile(file: File, unit: UnitId = "mm"): Promise<LoadedModel> {
  const ext = extensionOf(file.name);
  const buffer = await file.arrayBuffer();

  let geometry: THREE.BufferGeometry;

  switch (ext) {
    case ".stl":
      geometry = new STLLoader().parse(buffer);
      break;
    case ".ply":
      geometry = new PLYLoader().parse(buffer);
      break;
    case ".obj": {
      const text = new TextDecoder().decode(buffer);
      geometry = flattenToGeometry(new OBJLoader().parse(text));
      break;
    }
    case ".3mf":
      geometry = flattenToGeometry(new ThreeMFLoader().parse(buffer));
      break;
    default:
      throw new UnsupportedFileError(ext);
  }

  if (geometry.index) geometry = geometry.toNonIndexed();
  geometry.computeVertexNormals();

  const stats = measureGeometry(geometry, unit);
  if (stats.triangles === 0) throw new EmptyModelError();

  return { geometry, stats };
}

export class UnsupportedFileError extends Error {
  constructor(public readonly extension: string) {
    super(`Unsupported file type: ${extension}`);
    this.name = "UnsupportedFileError";
  }
}

export class EmptyModelError extends Error {
  constructor() {
    super("The file contains no printable geometry");
    this.name = "EmptyModelError";
  }
}
