"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { DriftingPartsProps } from "./DriftingParts";

/**
 * The scene is decoration, so it is held back until the browser is idle and
 * skipped entirely for anyone on Data Saver. Pages that use it still render
 * and read perfectly with no WebGL at all.
 */
const DriftingParts = dynamic(() => import("./DriftingParts"), {
  ssr: false,
  loading: () => null,
});

interface NetworkInformation {
  saveData?: boolean;
}

export function DriftingPartsLazy(props: DriftingPartsProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return;

    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const handle = idle(() => setReady(true), { timeout: 2500 });
      return () => window.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <DriftingParts {...props} />;
}
