#!/usr/bin/env python3
"""Draw the bar fields behind the showcase story cards.

Each product's own app icon (public/products/<slug>/icon.png) is enlarged,
cropped by the card and redrawn as thin vertical strokes, like a halftone
cut into columns. The output is a white-on-transparent SVG used as a CSS
mask, so the colour of the strokes stays in the stylesheet.

Run from the repository root (Pillow required, no network):
    python3 tools/story-card-fields.py
Output: public/showcase/2026-11/cards/<slug>-field.svg
"""
from pathlib import Path
from PIL import Image, ImageFilter

W, H = 300, 400          # card viewBox (3:4)
PITCH, STEP = 6, 3       # column pitch, row step (viewBox units)
OUT = Path("public/showcase/2026-11/cards")

# (centre x, centre y, icon size) as fractions of the card width/height.
PLACE = {
    "sotro": (0.62, 0.40, 1.35),
    "sotam": (0.58, 0.38, 1.45),
    "vungtaylai": (0.64, 0.40, 1.30),
}


def h32(a: int, b: int) -> float:
    h = (a * 374761393 + b * 668265263) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFFFFFF) / 0xFFFFFFFF


def field(slug: str) -> list[list[float]]:
    icon = Image.open(f"public/products/{slug}/icon.png").convert("RGBA")
    cx, cy, size = PLACE[slug]
    side = round(W * size)
    icon = icon.resize((side, side), Image.LANCZOS)
    bg = icon.getpixel((2, 2))
    canvas = Image.new("L", (W, H), 0)
    mask = Image.new("L", icon.size, 0)
    px = icon.load()
    mp = mask.load()
    for y in range(side):
        for x in range(side):
            r, g, b, a = px[x, y]
            if bg[3] < 16:
                v = a
            else:
                d = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
                v = min(255, int(a * min(1.0, d / 90)))
            mp[x, y] = v
    canvas.paste(mask, (round(W * cx - side / 2), round(H * cy - side / 2)))
    canvas = canvas.filter(ImageFilter.GaussianBlur(2))
    cp = canvas.load()
    cols, rows = W // PITCH, H // STEP
    out = []
    for c in range(cols):
        col = []
        for r in range(rows):
            y = r * STEP
            fy = y / H
            fade = 1 if fy < 0.5 else max(0.22, 1 - (fy - 0.5) * 2.4)
            col.append(cp[c * PITCH + PITCH // 2, min(H - 1, y + 1)] / 255 * fade)
        out.append(col)
    return out


def svg(slug: str) -> str:
    grid = field(slug)
    groups: dict[str, list[str]] = {}
    for c, col in enumerate(grid):
        run = None  # (opacity, width, start_row, length)

        def flush():
            if run:
                o, w, r0, n = run
                x = c * PITCH + (PITCH - w) / 2
                groups.setdefault(o, []).append(
                    f"M{x:g} {r0 * STEP}h{w:g}v{n * STEP}h-{w:g}z"
                )

        for r, l in enumerate(col):
            n = h32(c, r)
            brk = h32(c * 31 + 7, r)
            if l > 0.04:
                if brk < 0.10 * (1.2 - l):
                    flush(); run = None; continue
                o = f"{min(0.9, 0.16 + l * 0.62):.1f}"
                w = 2.4 if n > 0.9 else (1.6 if l > 0.5 and n > 0.55 else 1)
            elif n > 0.988 and brk > 0.5:
                o, w = "0.1", 1
            else:
                flush(); run = None; continue
            if run and run[0] == o and run[1] == w and run[2] + run[3] == r:
                run = (o, w, run[2], run[3] + 1)
            else:
                flush(); run = (o, w, r, 1)
        flush()
    body = "".join(
        f'<path fill-opacity="{o}" d="{"".join(d)}"/>' for o, d in sorted(groups.items())
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'preserveAspectRatio="xMidYMid slice" fill="#fff">{body}</svg>\n'
    )


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in PLACE:
        (OUT / f"{slug}-field.svg").write_text(svg(slug))
        print(slug, (OUT / f"{slug}-field.svg").stat().st_size, "bytes")
