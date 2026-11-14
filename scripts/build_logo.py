"""Rebuild the brand PNGs from the supplied artwork.

Re-runnable: always starts from public/brand/logo.jpg, so it can be adjusted
and run again without compounding on an already-processed file.
"""
import pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from png_rgba import to_rgba, write_rgba

SRC = "public/brand/logo.jpg"
BLACK_POINT = 0.075   # below this the pixel is background
KNEE = 0.34           # fully opaque at or above this
FEATHER = 0.10        # fraction of each edge faded out, to kill the crop box

# name, crop H, crop W, offset Y, offset X, final width
CROPS = [
    ("mark",     560, 740,  40, 330, 560),
    ("wordmark", 150, 1100, 600, 230, 600),
    ("lockup",   830, 1100, 40, 230, 700),
]


def run(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def cutout(path):
    width, height, px = to_rgba(pathlib.Path(path).read_bytes())
    out = bytearray(len(px))

    band_x = max(1.0, width * FEATHER)
    band_y = max(1.0, height * FEATHER)

    for y in range(height):
        edge_y = min(y, height - 1 - y) / band_y
        edge_y = 1.0 if edge_y > 1.0 else edge_y
        row = y * width * 4

        for x in range(width):
            i = row + x * 4
            r, g, b = px[i], px[i + 1], px[i + 2]
            peak = max(r, g, b) / 255.0
            if peak <= BLACK_POINT:
                continue

            a = (peak - BLACK_POINT) / (KNEE - BLACK_POINT)
            if a > 1.0:
                a = 1.0

            edge_x = min(x, width - 1 - x) / band_x
            if edge_x > 1.0:
                edge_x = 1.0
            a *= edge_x * edge_y
            if a <= 0.004:
                continue

            scale = 1.0 / max(peak, 0.001)   # keep the glow's hue as alpha drops
            out[i]     = min(255, int(r * scale))
            out[i + 1] = min(255, int(g * scale))
            out[i + 2] = min(255, int(b * scale))
            out[i + 3] = int(a * 255)

    size = write_rgba(path, width, height, out)
    clear = sum(1 for i in range(3, len(out), 4) if out[i] == 0)
    print(f"  {pathlib.Path(path).name:<14} {width}x{height}  "
          f"{clear * 100 // (width * height)}% clear  {size} bytes")


for name, ch, cw, oy, ox, final in CROPS:
    dest = f"public/brand/{name}.png"
    run("sips", "-s", "format", "png", "-c", str(ch), str(cw),
        "--cropOffset", str(oy), str(ox), SRC, "--out", dest)
    run("sips", "-Z", str(final), dest, "--out", dest)
    cutout(dest)


# ---------------------------------------------------------------------------
# PWA / app icons
#
# These are composited onto the brand near-black rather than left transparent:
# Android crops a maskable icon to a circle and fills behind it, and a neon
# logo on a white fill disappears.
# ---------------------------------------------------------------------------

ICON_BG = (0x05, 0x05, 0x07)
ICON_SIZES = (192, 512)


def square_icon(out_path, size):
    w, h, px = to_rgba(pathlib.Path("public/brand/mark.png").read_bytes())
    side = max(w, h)
    pad_x, pad_y = (side - w) // 2, (side - h) // 2

    canvas = bytearray()
    for _ in range(side * side):
        canvas += bytes((*ICON_BG, 255))

    for y in range(h):
        for x in range(w):
            s = (y * w + x) * 4
            a = px[s + 3] / 255.0
            if a <= 0:
                continue
            d = ((y + pad_y) * side + (x + pad_x)) * 4
            for ch in range(3):
                canvas[d + ch] = int(px[s + ch] * a + canvas[d + ch] * (1 - a))

    tmp = f"{out_path}.full.png"
    write_rgba(tmp, side, side, canvas)
    run("sips", "-Z", str(size), tmp, "--out", out_path)
    pathlib.Path(tmp).unlink()

    # sips can drop the alpha channel; Next's ICO/PNG handling wants RGBA back
    iw, ih, ipx = to_rgba(pathlib.Path(out_path).read_bytes())
    write_rgba(out_path, iw, ih, ipx)
    print(f"  {pathlib.Path(out_path).name:<14} {iw}x{ih}  {pathlib.Path(out_path).stat().st_size} bytes")


pathlib.Path("public/icons").mkdir(parents=True, exist_ok=True)
for s in ICON_SIZES:
    square_icon(f"public/icons/icon-{s}.png", s)
