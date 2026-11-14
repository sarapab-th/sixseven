import type { MetadataRoute } from "next";
import { site } from "~/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.legalName,
    short_name: site.name,
    description: "3D printing, digital printing and copying in Bangkok.",
    start_url: `/${site.defaultLocale}`,
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    icons: [
      // Generated from the real mark by scripts/build_logo.py. They carry the
      // brand near-black rather than transparency: Android crops a maskable
      // icon and fills behind it, and neon on white disappears.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
