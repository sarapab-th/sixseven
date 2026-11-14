# SixSeven — 3D printing & print shop website

Bilingual (Thai / English) marketing site with a working instant-quote engine
for both 3D printing and A3/A4 document printing.

- **Thai is the default language.** `/` redirects to `/th`; `/en` is the English
  version. Every page carries `hreflang` alternates so Google serves the right one.
- **Quotes are calculated in the visitor's browser.** An uploaded STL is parsed
  and measured locally — nothing leaves their machine until they press *Send*.
- **Requests arrive by email** with a download link for the file, plus a copy
  written to `storage/quote-requests.jsonl` so nothing is ever lost.

---

## Run it

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 — it redirects to `/th`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | TypeScript, no emit |

---

## The two files you will actually edit

Everything a shop owner needs to change lives in `config/`. No other file needs
touching to go live.

### `config/site.ts` — who you are
Shop name, email, phone, LINE id, street address, map coordinates, opening
hours, upload limits.

> **Replace the placeholders.** The address, phone and LINE id that ship with
> this project are examples. They also feed the `LocalBusiness` structured data
> that Google reads, so wrong values there become wrong values in search results.

### `config/pricing.ts` — what you charge
Every price on the website comes from this one file, in Thai Baht.

```ts
{ id: "pla", process: "fdm", density: 1.24, pricePerGram: 4.5, … }
```

| Section | Controls |
| --- | --- |
| `PROCESSES` | Build volumes, setup fees, machine hourly rate, print speed |
| `MATERIALS` | The nine filaments and resins, their density, price per gram, colours |
| `QUALITY_TIERS` | Layer heights and what each one costs |
| `INFILL_OPTIONS`, `FINISHING_3D` | Infill choices and finishing extras |
| `QUANTITY_BREAKS`, `TURNAROUND` | Volume discounts and rush surcharges |
| `PRINT_TIERS` | A4/A3 colour and mono rates, per side, by quantity |
| `PAPER_STOCKS`, `FINISHING_PRINT` | Paper types and binding/lamination |
| `COPY_SERVICE` | Photocopy handling and scan-to-PDF rates |
| `VAT` | Set `enabled: false` if you are not VAT registered |

Change a number, save, and the whole site updates — pages, tables and both
calculators all read from here.

### `config/gallery.ts` — your work
Point each entry at a file in `public/photos/`. Items left as `image: null`
render a branded gradient tile, so the page never looks broken.

### Brand artwork
`public/brand/logo.jpg` is the supplied logo. The mark, wordmark and full
lockup used around the site are cut from it by `scripts/build_logo.py`, which
keys the black background out to real alpha and feathers the crop edges — run
it again after replacing the artwork. See [scripts/README.md](scripts/README.md).

### `config/photos.ts` — photography
Every photo slot on the site: the shop strip on the landing page, both service
cards, and the contact page. Set `src` to `"/photos/your-file.jpg"`, rewrite
`alt` to describe the shot, and delete that slot's `credit`.

> **The shipped photographs are stock placeholders.** They are CC0 / Public
> Domain Mark — free for commercial use, no attribution required, modification
> allowed — and each one records its source in `credit`. They are there so the
> design can be judged with real photography in it, **not** because they show
> your shop.
>
> Replace them before you go live. A customer reading *"a sample of what has
> come off the machines lately"* over a photograph of someone else's printer
> is being told something untrue. A phone camera and good window light beats
> any stock photo here — customers can tell, and your own machines are the
> whole point.

Any slot set back to `null` falls through to the branded gradient tile, so you
can remove a placeholder immediately and fill it later.

---

## Receiving quote requests

Copy `.env.example` to `.env.local` and fill in whichever you use.

**Email — pick one:**

- **Resend** (simplest): set `RESEND_API_KEY`. No extra packages.
- **Your own SMTP**: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

Also set `MAIL_FROM` (an address on a domain your provider has verified) and
`MAIL_TO` (where requests should land).

With neither configured the site still works: every request is appended to
`storage/quote-requests.jsonl` and a warning is logged. Nothing is dropped.

**File storage:**

- `STORAGE_DRIVER=local` (default) writes to `storage/uploads/<token>/`. Right
  for a VPS, Docker, or anywhere with a real disk.
- `STORAGE_DRIVER=blob` uses Vercel Blob — needed on serverless hosts, where the
  filesystem is wiped between requests. Set `BLOB_READ_WRITE_TOKEN`.

Download links use a 128-bit random token in the path and are only ever sent in
the notification email, so they are unguessable. `/api/` is disallowed in
`robots.txt`.

> **Deploying to Vercel:** serverless functions cap request bodies at about
> 4.5 MB, well under the 100 MB upload limit in `config/site.ts`. Either switch
> to `STORAGE_DRIVER=blob` with client-side uploads, or host somewhere with a
> normal request size limit (a VPS, Render, Railway, Fly).

---

## How the quote engine works

`src/lib/` holds pure functions, shared by the browser and the server, so the
live price and the submitted price can never disagree.

**`mesh.ts`** parses STL, OBJ, 3MF and PLY with three.js and measures the model.
Volume comes from a signed-tetrahedron sum over every triangle: on a sealed
solid the signed volumes cancel everywhere except inside the part. When they
*don't* cancel, the mesh has holes — that is how the "not fully sealed" warning
is detected.

**`quote-3d.ts`** turns those measurements into money:

1. **Material used.** FDM prints solid perimeter walls regardless of infill, so
   shell volume (`surface area × wall thickness`) is charged in full and only
   the interior is multiplied by the infill percentage. Resin parts cure solid,
   plus a support allowance.
2. **Machine time.** FDM is volumetric (cm³/hour) plus a per-layer travel
   overhead. Resin cures a whole layer at once, so its time depends on layer
   count and height — not on how much resin each layer holds.
3. **Price.** `material × price per gram` + `hours × machine rate`, then the
   quality premium, quantity discount, finishing, setup fee, rush surcharge,
   shop minimum and VAT, in that order.

**`quote-print.ts`** does the paper side: quantity tiers per side, paper stock
multiplier, duplex saving, copy handling, scanning, finishing and rush.

Warnings surface automatically for parts that exceed the build volume, meshes
that are not watertight, very small parts, very long prints and very heavy meshes.

---

## Project layout

```
config/            site.ts · pricing.ts · gallery.ts · photos.ts   ← edit these
scripts/           build_logo.py — regenerates the brand PNGs from logo.jpg
messages/          th.json · en.json (503 keys, kept in sync)
src/
  app/[locale]/    home · 3d-printing · printing · quote · gallery · faq · contact
  app/api/         quote (submission) · files (token-protected download)
  components/
    hero/          the WebGL print-bed scene
    quote/         dropzones, viewer, both calculators, the request form
  i18n/            routing, navigation, request config
  lib/             mesh · quote-3d · quote-print · storage · mailer · seo
public/photos/     stock placeholders — swap for your own
storage/uploads/   customer files (git-ignored)
```

---

## The 3D scene

The hero runs a part building up layer by layer on a print bed: a clipping plane
sweeps upward while a patched standard material draws extrusion lines and a hot
glow just under the nozzle. It cycles through a gear, a torus knot, a bracket
and a faceted shell.

It is deliberately decorative and never blocks the page:

- loaded only in the browser, after the page is interactive (`ssr: false`);
- the headline above it is plain server-rendered HTML, which is what search
  engines and slow connections get;
- rendering stops when the hero scrolls out of view or the tab is hidden;
- `prefers-reduced-motion` shows the finished part with no animation.

The same machinery powers the **Layer preview** tab on the quote page, where the
layer count shown is the real one for the chosen layer height.

---

## Accessibility & SEO notes

- Static prerendering for all 12 content pages; only `/quote` and the API routes
  are dynamic.
- `LocalBusiness`, `WebSite`, `Service`, `FAQPage` and `BreadcrumbList`
  structured data, generated from `config/site.ts`.
- FAQ answers use `<details>`/`<summary>`, so they work and are crawlable with
  JavaScript disabled.
- Canonical URLs, `hreflang` (including `x-default`), OpenGraph and Twitter
  cards, sitemap and robots are all generated — no manual upkeep.
- Thai gets its own line-height rules; both fonts (Chakra Petch, Sarabun) carry
  Thai and Latin glyphs.
- Skip link, focus rings, labelled form controls, `radiogroup`/`tablist` roles
  on the custom pickers.

---

## Before going live

1. Replace the contact details and address in `config/site.ts`.
2. Set your real prices in `config/pricing.ts`.
3. Set `NEXT_PUBLIC_SITE_URL` to your domain.
4. Configure email (`RESEND_API_KEY` or SMTP) and send yourself a test quote.
5. Replace every stock photo in `public/photos/` with your own, and clear the
   `credit` fields in `config/photos.ts` as you go.
6. Swap `public/brand/og.jpg` if you want a different social sharing image.
7. Add your Google Search Console token as `GOOGLE_SITE_VERIFICATION`, then
   submit `https://yourdomain/sitemap.xml`.
8. Decide how long you keep customer files — the FAQ currently promises 90 days.
