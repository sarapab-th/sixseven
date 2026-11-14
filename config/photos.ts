/**
 * ============================================================
 *  PHOTOGRAPHY
 * ============================================================
 *  Every photo slot on the site, in one place.
 *
 *  To use your own picture:
 *    1. drop the file into  public/photos/
 *    2. set `src` to "/photos/your-file.jpg"
 *    3. rewrite `alt` to describe what is actually in the shot
 *    4. delete that slot's `credit` — it belongs to the stock photo
 *
 *  Set `src` to null and the slot falls back to a branded gradient
 *  tile. The layout never breaks, it just loses the photograph.
 *
 *  วิธีใส่รูปของคุณเอง: วางไฟล์ใน public/photos/ แล้วแก้ค่า src
 *  เป็น "/photos/ชื่อไฟล์.jpg" และแก้คำบรรยาย alt ให้ตรงกับรูป
 *
 *  ⚠️  THESE ARE STOCK PLACEHOLDERS — not pictures of your shop,
 *      your machines or your work. They are here so the design can
 *      be judged with real photography in it. Replace them with
 *      your own before you go live: a customer reading "a sample of
 *      what has come off the machines lately" over someone else's
 *      printer is being told something untrue.
 *
 *  Licensing: every shipped photo is CC0 or Public Domain Mark —
 *  free for commercial use, no attribution required, modification
 *  allowed. The `credit` on each is recorded as good practice, not
 *  obligation, and is not rendered anywhere on the site.
 * ============================================================
 */

export interface PhotoCredit {
  creator: string;
  source: string;
  license: "cc0" | "pdm";
  url: string;
}

export interface PhotoSlot {
  src: string | null;
  alt: { en: string; th: string };
  /** Provenance of the shipped placeholder. Delete when you swap in your own. */
  credit?: PhotoCredit;
}

export const PHOTOS = {
  /** Wide shot heading the "inside the shop" strip on the landing page */
  shopWide: {
    src: "/photos/printer-3d-working.jpg",
    alt: {
      en: "An FDM 3D printer part-way through a print, nozzle over the bed",
      th: "เครื่องพิมพ์ 3 มิติระบบ FDM กำลังพิมพ์งาน หัวฉีดอยู่เหนือฐานพิมพ์",
    },
    credit: { creator: "Darryl", source: "WordPress Photos", license: "cc0", url: "https://wordpress.org/photos/photo/57961f0260/" },
  },
  shopPrinter: {
    src: "/photos/printer-3d-bed.jpg",
    alt: { en: "A desktop 3D printer on the shop bench", th: "เครื่องพิมพ์ 3 มิติตั้งโต๊ะบนโต๊ะทำงานในร้าน" },
    credit: { creator: "Kristin Hardwick", source: "StockSnap", license: "cc0", url: "https://stocksnap.io/photo/3d-printer-JCN9ZVO1SD" },
  },
  shopParts: {
    src: "/photos/part-orange.jpg",
    alt: { en: "A printed orange part with its dimension marked", th: "ชิ้นงานพิมพ์สีส้มพร้อมระบุขนาด" },
    credit: { creator: "FastCap", source: "Flickr", license: "cc0", url: "https://www.flickr.com/photos/140612216@N06/51586517914" },
  },
  shopPaper: {
    src: "/photos/copier-detail.jpg",
    alt: { en: "Pages coming out of the office printer", th: "กระดาษที่พิมพ์เสร็จออกมาจากเครื่องพิมพ์" },
    credit: { creator: "Matt Moloney", source: "StockSnap", license: "cc0", url: "https://stocksnap.io/photo/office-equipment-JKXHFU8F7N" },
  },

  /** The two service cards on the landing page */
  service3d: {
    src: "/photos/printer-3d-bed.jpg",
    alt: { en: "A 3D printer building a part", th: "เครื่องพิมพ์ 3 มิติกำลังขึ้นรูปชิ้นงาน" },
    credit: { creator: "Kristin Hardwick", source: "StockSnap", license: "cc0", url: "https://stocksnap.io/photo/3d-printer-JCN9ZVO1SD" },
  },
  servicePrint: {
    src: "/photos/copier-in-use.jpg",
    alt: { en: "Someone running a job on the office printer", th: "พนักงานกำลังสั่งงานพิมพ์ที่เครื่องพิมพ์สำนักงาน" },
    credit: { creator: "Matt Moloney", source: "StockSnap", license: "cc0", url: "https://stocksnap.io/photo/office-equipment-CDTOCJJ1RN" },
  },

  /** Heading the contact page */
  contactShop: {
    src: "/photos/copier-in-use.jpg",
    alt: { en: "The SixSeven counter", th: "เคาน์เตอร์ของร้าน SixSeven" },
    credit: { creator: "Matt Moloney", source: "StockSnap", license: "cc0", url: "https://stocksnap.io/photo/office-equipment-CDTOCJJ1RN" },
  },
} satisfies Record<string, PhotoSlot>;

export type PhotoKey = keyof typeof PHOTOS;

/** True while any slot is still showing a stock placeholder. */
export const hasPlaceholderPhotos = Object.values(PHOTOS).some((p) => Boolean(p.credit));
