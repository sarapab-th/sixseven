import Image from "next/image";
import { clsx } from "@/lib/clsx";

export interface PhotoSource {
  /** Path under /public, or null while you have not supplied a photo yet */
  src: string | null;
  /** Describe what is in the shot — this is what screen readers announce */
  alt?: string;
}

/**
 * A photo slot that never looks broken.
 *
 * With a `src` it renders a real photograph through next/image, tinted a
 * little towards the brand so a stock shot sits inside the dark palette
 * instead of punching a bright hole in it.
 *
 * Without one it falls back to a branded gradient tile, so the layout is
 * identical whether or not the shop has supplied that photo yet.
 */
export function Photo({
  src,
  alt = "",
  className,
  sizes = "100vw",
  priority = false,
  /** 0 = untouched photo, 1 = fully absorbed into the brand colours */
  tint = 0.45,
  /** Alternate the placeholder colours so a grid is not uniform */
  variant = 0,
  children,
}: PhotoSource & {
  className?: string;
  sizes?: string;
  priority?: boolean;
  tint?: number;
  variant?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className={clsx("relative overflow-hidden bg-ink-2", className)}>
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
          {/* Desaturate towards the ink colour, then darken proportionally —
              a stock shot on a white background otherwise punches a bright
              hole straight through a near-black page. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink mix-blend-color"
            style={{ opacity: tint }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink"
            style={{ opacity: tint * 0.5 }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(135deg,#00e5ff1f,transparent_45%,#ff2e8824)]"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              variant % 2 === 0
                ? "radial-gradient(ellipse 80% 70% at 30% 20%, #00e5ff26, transparent 70%), radial-gradient(ellipse 70% 60% at 80% 90%, #ff2e8820, transparent 70%)"
                : "radial-gradient(ellipse 80% 70% at 70% 25%, #9b5cff26, transparent 70%), radial-gradient(ellipse 70% 60% at 20% 85%, #00e5ff1f, transparent 70%)",
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-70" />
        </div>
      )}
      {children}
    </div>
  );
}
