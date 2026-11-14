"""Minimal PNG reader/writer so an opaque sips PNG can be re-emitted as RGBA.

Next's ICO decoder rejects anything that is not RGBA, and sips has no flag to
add an alpha channel. zlib and struct are all this needs.
"""
import struct, zlib

SIG = b"\x89PNG\r\n\x1a\n"


def _chunks(data):
    assert data[:8] == SIG, "not a PNG"
    pos = 8
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        ctype = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        yield ctype, body
        pos += 12 + length


def _paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    return b if pb <= pc else c


def to_rgba(data):
    """Return (width, height, bytearray of RGBA rows)."""
    header, idat = None, bytearray()
    for ctype, body in _chunks(data):
        if ctype == b"IHDR":
            header = struct.unpack(">IIBBBBB", body)
        elif ctype == b"IDAT":
            idat += body
        elif ctype == b"IEND":
            break

    width, height, depth, color, comp, filt, interlace = header
    if depth != 8 or interlace != 0:
        raise SystemExit(f"unsupported PNG: depth={depth} interlace={interlace}")

    channels = {0: 1, 2: 3, 4: 2, 6: 4}[color]
    raw = zlib.decompress(bytes(idat))
    stride = width * channels

    out = bytearray()
    prev = bytearray(stride)
    pos = 0
    for _ in range(height):
        ftype = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos + stride]); pos += stride
        for i in range(stride):
            a = line[i - channels] if i >= channels else 0
            b = prev[i]
            c = prev[i - channels] if i >= channels else 0
            x = line[i]
            if ftype == 1:   line[i] = (x + a) & 0xFF
            elif ftype == 2: line[i] = (x + b) & 0xFF
            elif ftype == 3: line[i] = (x + (a + b) // 2) & 0xFF
            elif ftype == 4: line[i] = (x + _paeth(a, b, c)) & 0xFF
        prev = line

        for px in range(width):
            o = px * channels
            if channels == 1:   r = g = bl = line[o]; al = 255
            elif channels == 2: r = g = bl = line[o]; al = line[o + 1]
            elif channels == 3: r, g, bl = line[o], line[o + 1], line[o + 2]; al = 255
            else:               r, g, bl, al = line[o], line[o + 1], line[o + 2], line[o + 3]
            out += bytes((r, g, bl, al))

    return width, height, out


def write_rgba(path, width, height, pixels):
    raw = bytearray()
    for y in range(height):
        raw.append(0)                                   # filter: none
        raw += pixels[y * width * 4:(y + 1) * width * 4]

    def chunk(ctype, body):
        return (struct.pack(">I", len(body)) + ctype + body
                + struct.pack(">I", zlib.crc32(ctype + body) & 0xFFFFFFFF))

    png = SIG
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    open(path, "wb").write(png)
    return len(png)


if __name__ == "__main__":
    import sys
    for path in sys.argv[1:]:
        w, h, px = to_rgba(open(path, "rb").read())
        size = write_rgba(path, w, h, px)
        print(f"  {path}  {w}x{h} -> RGBA, {size} bytes")
