import * as THREE from "three";

export interface LayerUniforms {
  uLayerHeight: THREE.IUniform<number>;
  uBuildHeight: THREE.IUniform<number>;
  uHotColor: THREE.IUniform<THREE.Color>;
  uHotStrength: THREE.IUniform<number>;
}

/**
 * A standard material with two printing-specific touches patched into its
 * shader:
 *
 *   1. horizontal layer lines, so the surface reads as extruded plastic
 *      rather than a smooth CG object;
 *   2. a hot glow just under the current build height, the way freshly
 *      laid filament glows before it cools.
 *
 * `anchor` decides which Y the bands are measured along:
 *
 *   "world"  — world-space Y, the same axis the clipping plane uses. Right for
 *              a part being printed in place: the bands stay level with the bed
 *              while the part turns on it.
 *   "object" — the part's own Y, scaled back into world units. Right for a
 *              finished part tumbling through space, where the layers are baked
 *              in and must roll with it.
 */
export function createLayerMaterial(options: {
  color: THREE.ColorRepresentation;
  layerHeight: number;
  hotColor: THREE.ColorRepresentation;
  clippingPlanes: THREE.Plane[];
  anchor?: "world" | "object";
}): THREE.MeshStandardMaterial & { layerUniforms: LayerUniforms } {
  const anchor = options.anchor ?? "world";

  const material = new THREE.MeshStandardMaterial({
    color: options.color,
    metalness: 0.28,
    roughness: 0.42,
    clippingPlanes: options.clippingPlanes,
    clipShadows: true,
    side: THREE.DoubleSide, // a clipped solid shows its inside
  });

  const uniforms: LayerUniforms = {
    uLayerHeight: { value: options.layerHeight },
    uBuildHeight: { value: 0 },
    uHotColor: { value: new THREE.Color(options.hotColor) },
    uHotStrength: { value: 1.25 },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    // length(modelMatrix[1].xyz) is the model's Y scale, so an object-anchored
    // band keeps a constant physical height however big the part is rendered.
    const layerAxis =
      anchor === "object"
        ? "vLayerY = transformed.y * length(modelMatrix[1].xyz);"
        : "vLayerY = (modelMatrix * vec4(transformed, 1.0)).y;";

    shader.vertexShader = `varying float vLayerY;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       ${layerAxis}`,
    );

    shader.fragmentShader = `
      varying float vLayerY;
      uniform float uLayerHeight;
      uniform float uBuildHeight;
      uniform vec3  uHotColor;
      uniform float uHotStrength;
      ${shader.fragmentShader}
    `.replace(
      "#include <dithering_fragment>",
      `#include <dithering_fragment>

       // --- extrusion layer lines ---
       float lp   = vLayerY / max(uLayerHeight, 0.0001);
       float band = abs(fract(lp) - 0.5) * 2.0;
       float line = smoothstep(0.45, 1.0, band);
       gl_FragColor.rgb *= mix(1.0, 0.58, line);

       // --- hot filament just below the nozzle ---
       float below = max(uBuildHeight - vLayerY, 0.0);
       float hot   = exp(-below * 34.0);
       gl_FragColor.rgb += uHotColor * hot * uHotStrength;`,
    );
  };

  // Changing onBeforeCompile means three must recompile; this key tells it so.
  material.customProgramCacheKey = () => `sixseven-layer-v2-${anchor}`;

  return Object.assign(material, { layerUniforms: uniforms });
}
