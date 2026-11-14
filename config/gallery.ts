/**
 * ============================================================
 *  GALLERY
 * ============================================================
 *  To show your own photographs:
 *    1. drop the image files into  public/photos/
 *    2. set `image` below to "/photos/your-file.jpg"
 *
 *  Any item with `image: null` renders a branded placeholder
 *  tile instead, so the page never looks broken.
 *
 *  วิธีใส่รูปผลงานจริง: วางไฟล์ไว้ใน public/photos/
 *  แล้วแก้ค่า image เป็น "/photos/ชื่อไฟล์.jpg"
 * ============================================================
 */

export type GalleryCategory = "3d" | "print";

export interface GalleryItem {
  /** Must match a key under `gallery.items` in messages/*.json */
  id: string;
  category: GalleryCategory;
  image: string | null;
  /** Tile size in the masonry-ish grid */
  span?: "wide" | "tall" | "normal";
}

export const GALLERY: GalleryItem[] = [
  // Photos are only set where the stock shot honestly matches the caption.
  // The rest render as branded tiles, so the grid reads as a deliberate mix
  // rather than a wall of images that do not match what they claim to show.
  { id: "drone",   category: "3d",    image: null,                       span: "wide" },
  { id: "mini",    category: "3d",    image: "/photos/part-bust.jpg" },
  { id: "housing", category: "3d",    image: "/photos/part-orange.jpg" },
  { id: "model",   category: "3d",    image: null,                       span: "tall" },
  { id: "gasket",  category: "3d",    image: "/photos/part-dove.jpg" },
  { id: "thesis",  category: "print", image: "/photos/documents-desk.jpg" },
  { id: "poster",  category: "print", image: "/photos/copier-in-use.jpg", span: "wide" },
  { id: "sticker", category: "print", image: null },
];
