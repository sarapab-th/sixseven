# Build scripts

## `build_logo.py` — brand PNGs from the supplied artwork

```bash
python3 scripts/build_logo.py
```

Rebuilds `public/brand/{mark,wordmark,lockup}.png` from `public/brand/logo.jpg`.

The supplied logo is neon on black with no alpha channel. Screen-blending it
looks like the easy answer, but the artwork came from a JPEG, so its "black"
sits a few levels above zero and screening lifts a visible rectangle out of the
page. Instead this crops the three regions, keys alpha from pixel brightness,
un-premultiplies towards each pixel's own hue so the outer glow keeps its
colour, and feathers the crop edges so the glow fades out rather than stopping
at a hard border.

Re-runnable: it always starts from `logo.jpg`, so you can tune the constants at
the top (`BLACK_POINT`, `KNEE`, `FEATHER`, and the crop rectangles) and run it
again without compounding on an already-processed file.

**If the logo artwork changes**, drop the new file in as
`public/brand/logo.jpg`, check the crop rectangles still frame the right
regions, and re-run. Then regenerate the icons — see below.

## `png_rgba.py` — minimal PNG reader/writer

Imported by `build_logo.py`. `sips` has no flag to add an alpha channel and
Next's ICO decoder rejects anything that is not RGBA, so this decodes and
re-emits PNGs as RGBA using only `zlib` and `struct`. No image library needed.

## Icons

`src/app/favicon.ico` and `src/app/apple-icon.png` are generated from the same
mark. Both must be **RGBA** — Next fails the build on an RGB ICO with
"The PNG is not in RGBA format!".
