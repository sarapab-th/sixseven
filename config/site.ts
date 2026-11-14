/**
 * ============================================================
 *  SIXSEVEN — SITE CONFIGURATION
 * ============================================================
 *  Edit everything about your business here. Nothing in this
 *  file is code logic — it is all plain values you can change.
 *
 *  แก้ไขข้อมูลธุรกิจทั้งหมดได้ที่ไฟล์นี้
 * ============================================================
 */

export const site = {
  /** Brand name shown in the browser tab and structured data */
  name: "SixSeven",
  legalName: "SixSeven 3D Printing Service",
  nameTh: "ซิกซ์เซเว่น",

  /** Production domain. Used for canonical URLs, sitemap and OG tags. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sixseven.co.th",

  /** ---------- CONTACT — replace these with your real details ---------- */
  contact: {
    email: "hello@sixseven.co.th",
    /** Where quote requests are delivered. Can be the same as above. */
    orders: "orders@sixseven.co.th",
    phone: "+66 00 000 0000",
    /** Digits only, for click-to-call and WhatsApp style links */
    phoneRaw: "+660000000000",
    /** Your LINE Official Account id, including the @ */
    lineId: "@sixseven",
    lineUrl: "https://line.me/R/ti/p/@sixseven",
    facebook: "https://facebook.com/sixseven3d",
    instagram: "https://instagram.com/sixseven3d",
    tiktok: "https://tiktok.com/@sixseven3d",
  },

  /** ---------- SHOP LOCATION — used for Google local SEO ---------- */
  address: {
    street: "123 Example Road",
    district: "Watthana",
    city: "Bangkok",
    region: "Bangkok",
    postalCode: "10110",
    country: "TH",
    countryName: "Thailand",
    /** Coordinates of the shop — find them by right-clicking in Google Maps */
    lat: 13.7563,
    lng: 100.5018,
    mapsUrl: "https://maps.google.com/?q=13.7563,100.5018",
  },

  /** ---------- OPENING HOURS — 24h format ---------- */
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
    { days: ["Saturday"], opens: "10:00", closes: "17:00" },
  ],
  closedDays: ["Sunday"],

  /** ---------- SEO ---------- */
  defaultLocale: "th" as const,
  locales: ["th", "en"] as const,
  /** Shown as the social sharing image */
  ogImage: "/brand/og.jpg",
  /** Add this once you have it from Google Search Console */
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION ?? "",

  /** ---------- UPLOADS ---------- */
  upload: {
    /** Largest file a customer may upload, in megabytes */
    maxFileSizeMb: 100,
    maxFilesPerRequest: 10,
    model3dExtensions: [".stl", ".obj", ".3mf", ".ply"],
    documentExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".pptx", ".ai", ".psd"],
  },
} as const;

export type Site = typeof site;
