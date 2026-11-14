import Image from "next/image";
import { clsx } from "@/lib/clsx";

/**
 * The real artwork, not a redraw.
 *
 * The supplied logo is neon on black. Screen-blending it looked like the
 * obvious shortcut, but the file came from a JPEG, so its "black" sits a few
 * levels above zero and screening lifted a visible grey rectangle out of the
 * page. These PNGs are keyed to real alpha instead — see scripts/build_logo.py,
 * which regenerates them from logo.jpg — so they composite correctly over the
 * page, over the hero's WebGL scene, and over a photograph alike.
 */

export function LogoMark({
  className,
  alt = "",
  priority = false,
}: { className?: string; alt?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/mark.png"
      alt={alt}
      width={560}
      height={423}
      priority={priority}
      className={clsx("w-auto select-none", className ?? "h-9")}
    />
  );
}

export function Logo({
  className,
  compact = false,
  priority = false,
}: { className?: string; compact?: boolean; priority?: boolean }) {
  if (compact) {
    return <LogoMark className={clsx("h-8", className)} alt="SixSeven" priority={priority} />;
  }

  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-10" priority={priority} />
      <Image
        src="/brand/wordmark.png"
        alt="SixSeven"
        width={600}
        height={82}
        priority={priority}
        className="h-[1.22rem] w-auto select-none"
      />
    </span>
  );
}

/** The full stacked lockup — mark, wordmark and tagline. For the footer. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/lockup.png"
      alt="SixSeven — 3D printing service"
      width={700}
      height={528}
      className={clsx("h-auto select-none", className ?? "w-48")}
    />
  );
}
