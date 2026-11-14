"use client";

import dynamic from "next/dynamic";

/**
 * The WebGL scene is a decoration, so it is loaded only in the browser and
 * only after the page is interactive. The headline above it is plain server
 * rendered HTML, which is what search engines and slow connections get.
 */
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export function HeroCanvasLazy() {
  return <HeroScene />;
}
